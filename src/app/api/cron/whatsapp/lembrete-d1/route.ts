/**
 * Cron diário 18:00 BRT (21:00 UTC).
 * Dispara `lembrete_d1` para agendamentos do dia seguinte ainda
 * `agendado` ou `confirmado`. Idempotência via whatsapp_jobs_cron.
 */

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { assertCronAuth, CronAuthError } from "@/shared/lib/cron-auth";
import { dispararLembreteD1 } from "@/features/whatsapp/disparos";
import { isEnviosAtivos } from "@/features/whatsapp/sender";

export const dynamic = "force-dynamic";

const MARCO = "d-1";

function dataAmanhaIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
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

  const amanha = dataAmanhaIso();
  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("id, status")
    .eq("data", amanha)
    .in("status", ["agendado", "confirmado"]);

  if (error) {
    console.error("cron lembrete-d1 fetch:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const resultados = { processados: 0, enviados: 0, pulados: 0, falhas: 0 };

  for (const ag of agendamentos ?? []) {
    resultados.processados += 1;

    const { data: existente } = await supabase
      .from("whatsapp_jobs_cron")
      .select("id")
      .eq("tipo", "lembrete_d1")
      .eq("alvo_id", ag.id)
      .eq("marco", MARCO)
      .maybeSingle();
    if (existente) {
      resultados.pulados += 1;
      continue;
    }

    const result = await dispararLembreteD1(supabase, { agendamentoId: ag.id });
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
      tipo: "lembrete_d1",
      alvo_id: ag.id,
      marco: MARCO,
      msg_id: msgId,
      sucesso,
      erro,
    });

    if (sucesso) resultados.enviados += 1;
    else resultados.falhas += 1;
  }

  return NextResponse.json({ ok: true, amanha, ...resultados });
}
