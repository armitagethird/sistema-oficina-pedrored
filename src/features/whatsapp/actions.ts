"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { SETTINGS_KEYS } from "./constants";
import {
  atualizarTemplateSchema,
  configWhatsappSchema,
  enviarMensagemSchema,
  type AtualizarTemplateInput,
  type ConfigWhatsappInput,
  type EnviarMensagemInput,
} from "./schemas";
import {
  enviarMensagemCore,
  type EnviarResult,
} from "./sender";
import type { WhatsappTemplate } from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateWhatsapp() {
  revalidatePath("/app/whatsapp");
  revalidatePath("/app/whatsapp/conversas");
  revalidatePath("/app/whatsapp/templates");
  revalidatePath("/app/whatsapp/configuracoes");
}

export async function enviarMensagem(
  input: EnviarMensagemInput,
): Promise<ActionResult<EnviarResult>> {
  const parsed = enviarMensagemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const result = await enviarMensagemCore(supabase, {
    telefone: parsed.data.telefone,
    conteudo: parsed.data.conteudo,
    templateTipo: parsed.data.template_tipo,
    clienteId: parsed.data.cliente_id ?? null,
    osId: parsed.data.os_id ?? null,
    agendamentoId: parsed.data.agendamento_id ?? null,
    pagamentoId: parsed.data.pagamento_id ?? null,
  });

  revalidateWhatsapp();
  return { ok: true, data: result };
}

export async function atualizarTemplate(
  input: AtualizarTemplateInput,
): Promise<ActionResult<WhatsappTemplate>> {
  const parsed = atualizarTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_templates")
    .update({
      template_texto: parsed.data.template_texto,
      ...(parsed.data.ativo !== undefined ? { ativo: parsed.data.ativo } : {}),
    })
    .eq("tipo", parsed.data.tipo)
    .select("*")
    .single();

  if (error || !data) {
    console.error("atualizarTemplate:", error);
    return { ok: false, error: error?.message ?? "Não foi possível atualizar" };
  }

  revalidateWhatsapp();
  return { ok: true, data: data as WhatsappTemplate };
}

export async function atualizarConfig(
  input: ConfigWhatsappInput,
): Promise<ActionResult> {
  const parsed = configWhatsappSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const updates: Array<{ chave: string; valor: string }> = [];

  if (parsed.data.envios_ativos !== undefined) {
    updates.push({
      chave: SETTINGS_KEYS.enviosAtivos,
      valor: parsed.data.envios_ativos ? "true" : "false",
    });
  }
  if (parsed.data.oleo_km_intervalo !== undefined) {
    updates.push({
      chave: SETTINGS_KEYS.oleoKmIntervalo,
      valor: String(parsed.data.oleo_km_intervalo),
    });
  }
  if (parsed.data.oleo_km_antecedencia !== undefined) {
    updates.push({
      chave: SETTINGS_KEYS.oleoKmAntecedencia,
      valor: String(parsed.data.oleo_km_antecedencia),
    });
  }
  if (parsed.data.oleo_km_dia !== undefined) {
    updates.push({
      chave: SETTINGS_KEYS.oleoKmDia,
      valor: String(parsed.data.oleo_km_dia),
    });
  }

  for (const u of updates) {
    const { error } = await supabase
      .from("settings")
      .update({ valor: u.valor })
      .eq("chave", u.chave);
    if (error) {
      console.error("atualizarConfig:", u, error);
      return { ok: false, error: error.message ?? "Erro ao salvar" };
    }
  }

  revalidateWhatsapp();
  return { ok: true, data: undefined };
}

export async function togglePausaEnvios(
  ativo: boolean,
): Promise<ActionResult<boolean>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ valor: ativo ? "true" : "false" })
    .eq("chave", SETTINGS_KEYS.enviosAtivos);
  if (error) {
    console.error("togglePausaEnvios:", error);
    return { ok: false, error: error.message ?? "Erro ao salvar" };
  }
  revalidateWhatsapp();
  return { ok: true, data: ativo };
}

export async function reenviarMensagem(
  msgId: string,
): Promise<ActionResult<EnviarResult>> {
  const supabase = await createClient();
  const { data: original, error } = await supabase
    .from("whatsapp_msgs")
    .select("*")
    .eq("id", msgId)
    .maybeSingle();

  if (error || !original) {
    return { ok: false, error: "Mensagem original não encontrada" };
  }
  if (original.direcao !== "out") {
    return { ok: false, error: "Só é possível reenviar mensagens enviadas" };
  }

  const result = await enviarMensagemCore(supabase, {
    telefone: original.telefone,
    conteudo: original.conteudo,
    templateTipo: original.template_tipo ?? undefined,
    clienteId: original.cliente_id ?? null,
    osId: original.os_id ?? null,
    agendamentoId: original.agendamento_id ?? null,
    pagamentoId: original.pagamento_id ?? null,
  });

  revalidateWhatsapp();
  return { ok: true, data: result };
}
