/**
 * Cron semanal segunda 11:00 BRT (14:00 UTC).
 * Estima km atual de cada veículo (km_ultima_troca_oleo + dias×km/dia)
 * e dispara lembrete quando passou do limite `km_proxima_troca_oleo - antecedencia`.
 * Idempotência por mês (marco = `oleo-YYYY-MM`).
 */

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { assertCronAuth, CronAuthError } from "@/shared/lib/cron-auth";
import { SETTINGS_KEYS } from "@/features/whatsapp/constants";
import { dispararLembreteOleo } from "@/features/whatsapp/disparos";
import { isEnviosAtivos } from "@/features/whatsapp/sender";

export const dynamic = "force-dynamic";

function marcoMes(): string {
  const d = new Date();
  return `oleo-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function diasDesde(dataIso: string): number {
  const ref = new Date(`${dataIso}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((Date.now() - ref) / (1000 * 60 * 60 * 24)));
}

export async function GET(req: Request) {
  try {
    assertCronAuth(req);
  } catch (err) {
    if (err instanceof CronAuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
    }
    throw err;
  }

  const supabase = createServiceRoleClient();
  if (!(await isEnviosAtivos(supabase))) {
    return NextResponse.json({ ok: true, skipped: "kill-switch off" });
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("chave, valor")
    .in("chave", [
      SETTINGS_KEYS.oleoKmAntecedencia,
      SETTINGS_KEYS.oleoKmDia,
    ]);
  const map = Object.fromEntries(
    (settings ?? []).map((s) => [s.chave, s.valor as string]),
  );
  const antecedencia = parseInt(
    map[SETTINGS_KEYS.oleoKmAntecedencia] ?? "500",
    10,
  );
  const kmPorDia = parseInt(map[SETTINGS_KEYS.oleoKmDia] ?? "30", 10);

  const { data: veiculos, error } = await supabase
    .from("veiculos")
    .select(
      "id, km_atual, km_ultima_troca_oleo, data_ultima_troca_oleo, km_proxima_troca_oleo",
    )
    .is("deletado_em", null)
    .not("km_proxima_troca_oleo", "is", null);

  if (error) {
    console.error("cron lembrete-oleo-km fetch:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const marco = marcoMes();
  const resultados = { processados: 0, enviados: 0, pulados: 0, falhas: 0 };

  for (const v of veiculos ?? []) {
    if (!v.km_proxima_troca_oleo) continue;

    let kmEstimado: number;
    if (v.km_ultima_troca_oleo != null && v.data_ultima_troca_oleo) {
      const dias = diasDesde(v.data_ultima_troca_oleo);
      kmEstimado = v.km_ultima_troca_oleo + dias * kmPorDia;
    } else if (v.km_atual != null) {
      kmEstimado = v.km_atual;
    } else {
      continue;
    }

    if (kmEstimado < v.km_proxima_troca_oleo - antecedencia) continue;
    resultados.processados += 1;

    const { data: existente } = await supabase
      .from("whatsapp_jobs_cron")
      .select("id")
      .eq("tipo", "lembrete_oleo_km")
      .eq("alvo_id", v.id)
      .eq("marco", marco)
      .maybeSingle();
    if (existente) {
      resultados.pulados += 1;
      continue;
    }

    const result = await dispararLembreteOleo(supabase, {
      veiculoId: v.id,
      kmEstimado,
    });
    const sucesso = result.ok;
    let erro: string | null = null;
    let msgId: string | null = null;
    if (result.ok) {
      msgId = result.msg.id;
    } else if (result.reason === "skip") {
      erro = result.motivo;
    } else {
      erro = result.error ?? "erro desconhecido";
    }

    await supabase.from("whatsapp_jobs_cron").insert({
      tipo: "lembrete_oleo_km",
      alvo_id: v.id,
      marco,
      msg_id: msgId,
      sucesso,
      erro,
    });

    if (sucesso) resultados.enviados += 1;
    else resultados.falhas += 1;
  }

  return NextResponse.json({ ok: true, marco, ...resultados });
}
