/**
 * Cron diário 10:00 BRT (13:00 UTC).
 * Procura pagamentos com status `atrasado` e dispara cobrança nos
 * marcos {3, 7, 15} dias (idempotência por marco em whatsapp_jobs_cron).
 */

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { assertCronAuth, CronAuthError } from "@/shared/lib/cron-auth";
import {
  MARCOS_COBRANCA,
  type MarcoCobranca,
} from "@/features/whatsapp/constants";
import { dispararCobranca } from "@/features/whatsapp/disparos";
import { isEnviosAtivos } from "@/features/whatsapp/sender";

export const dynamic = "force-dynamic";

function diasDesde(dataIso: string): number {
  const ref = new Date(`${dataIso}T00:00:00Z`).getTime();
  const hoje = new Date();
  const hojeUtc = Date.UTC(
    hoje.getUTCFullYear(),
    hoje.getUTCMonth(),
    hoje.getUTCDate(),
  );
  return Math.floor((hojeUtc - ref) / (1000 * 60 * 60 * 24));
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

  const { data: pagamentos, error } = await supabase
    .from("pagamentos")
    .select("id, data_prevista")
    .eq("status", "atrasado");

  if (error) {
    console.error("cron cobranca-atraso fetch:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const resultados = { processados: 0, enviados: 0, pulados: 0, falhas: 0 };

  for (const pag of pagamentos ?? []) {
    if (!pag.data_prevista) continue;
    const dias = diasDesde(pag.data_prevista);
    const marco = MARCOS_COBRANCA.find((m) => m === dias) as
      | MarcoCobranca
      | undefined;
    if (!marco) continue;

    resultados.processados += 1;
    const marcoStr = `${marco}_dias`;

    const { data: existente } = await supabase
      .from("whatsapp_jobs_cron")
      .select("id")
      .eq("tipo", "cobranca_atraso")
      .eq("alvo_id", pag.id)
      .eq("marco", marcoStr)
      .maybeSingle();
    if (existente) {
      resultados.pulados += 1;
      continue;
    }

    const result = await dispararCobranca(supabase, {
      pagamentoId: pag.id,
      marco,
      diasAtraso: dias,
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
      tipo: "cobranca_atraso",
      alvo_id: pag.id,
      marco: marcoStr,
      msg_id: msgId,
      sucesso,
      erro,
    });

    if (sucesso) resultados.enviados += 1;
    else resultados.falhas += 1;
  }

  return NextResponse.json({ ok: true, ...resultados });
}
