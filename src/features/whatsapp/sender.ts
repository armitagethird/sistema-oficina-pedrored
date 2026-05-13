/**
 * Lógica de envio reutilizável entre server actions (UI),
 * crons (`/api/cron/whatsapp/*`) e endpoint manual (`/api/whatsapp/enviar`).
 *
 * Recebe o cliente Supabase pronto (ou service-role) — não cria por dentro
 * para preservar a separação entre contextos autenticados.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import {
  EvolutionApiError,
  createEvolutionClient,
  evolutionConfigFromEnv,
  type EvolutionClient,
  type EvolutionInstanceStatus,
} from "./evolution-client";
import { SETTINGS_KEYS } from "./constants";
import type {
  WhatsappTemplateTipo,
  WhatsappMsg,
} from "./types";

/**
 * Cliente Supabase tipado em cima do Database compartilhado. Aceita tanto
 * o cliente autenticado (`createClient`) quanto o service-role (`createServiceRoleClient`).
 */
type SBAny = SupabaseClient<Database>;

export interface EnviarMensagemPayload {
  telefone: string;
  conteudo: string;
  templateTipo?: WhatsappTemplateTipo;
  clienteId?: string | null;
  osId?: string | null;
  agendamentoId?: string | null;
  pagamentoId?: string | null;
}

export type EnviarResult =
  | { ok: true; msg: WhatsappMsg }
  | { ok: false; reason: "pausado" | "erro"; error?: string; msgId?: string };

/**
 * Lê o kill-switch global `whatsapp_envios_ativos` (default `true`).
 */
export async function isEnviosAtivos(supabase: SBAny): Promise<boolean> {
  const { data, error } = await supabase
    .from("settings")
    .select("valor")
    .eq("chave", SETTINGS_KEYS.enviosAtivos)
    .maybeSingle();
  if (error) {
    console.error("isEnviosAtivos:", error);
    return true;
  }
  if (!data) return true;
  return String(data.valor).toLowerCase() !== "false";
}

/**
 * Normaliza telefone para o formato esperado pela Evolution
 * (`5571987654321`, sem `+`, sem espaços/pontuação).
 *
 * Mantém o que foi passado se já estiver puramente numérico ≥ 10 dígitos
 * (assumindo que o autor já formatou). Caso contrário, remove tudo que não
 * for dígito e prepende `55` se faltar DDI.
 */
export function normalizarTelefone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

interface EnviarMensagemDeps {
  evolution?: EvolutionClient;
  /** Pra testes: pula o lookup de env. */
  skipEvolution?: boolean;
}

export async function enviarMensagemCore(
  supabase: SBAny,
  payload: EnviarMensagemPayload,
  deps: EnviarMensagemDeps = {},
): Promise<EnviarResult> {
  if (!(await isEnviosAtivos(supabase))) {
    return { ok: false, reason: "pausado" };
  }

  const telefone = normalizarTelefone(payload.telefone);

  const { data: inserted, error: insertErr } = await supabase
    .from("whatsapp_msgs")
    .insert({
      cliente_id: payload.clienteId ?? null,
      telefone,
      direcao: "out",
      template_tipo: payload.templateTipo ?? null,
      conteudo: payload.conteudo,
      status: "pendente",
      os_id: payload.osId ?? null,
      agendamento_id: payload.agendamentoId ?? null,
      pagamento_id: payload.pagamentoId ?? null,
    })
    .select("*")
    .single();

  if (insertErr || !inserted) {
    console.error("enviarMensagem insert:", insertErr);
    return { ok: false, reason: "erro", error: insertErr?.message ?? "DB insert" };
  }

  const msgId = (inserted as WhatsappMsg).id;

  let evolution = deps.evolution;
  if (!evolution && !deps.skipEvolution) {
    try {
      evolution = createEvolutionClient(evolutionConfigFromEnv());
    } catch (err) {
      const message =
        err instanceof EvolutionApiError ? err.message : "Evolution não configurada";
      await marcarFalha(supabase, msgId, message);
      return { ok: false, reason: "erro", error: message, msgId };
    }
  }

  if (!evolution) {
    await marcarFalha(supabase, msgId, "Evolution client indisponível");
    return { ok: false, reason: "erro", error: "Evolution client indisponível", msgId };
  }

  try {
    const result = await evolution.sendText({
      telefone,
      mensagem: payload.conteudo,
    });
    const { data: updated, error: updErr } = await supabase
      .from("whatsapp_msgs")
      .update({
        status: "enviada",
        evolution_msg_id: result.msgId || null,
        payload_raw: (result.raw ?? null) as Database["public"]["Tables"]["whatsapp_msgs"]["Update"]["payload_raw"],
        erro: null,
      })
      .eq("id", msgId)
      .select("*")
      .single();
    if (updErr || !updated) {
      console.error("enviarMensagem update:", updErr);
      return {
        ok: false,
        reason: "erro",
        error: updErr?.message ?? "DB update",
        msgId,
      };
    }
    return { ok: true, msg: updated as WhatsappMsg };
  } catch (err) {
    const message =
      err instanceof EvolutionApiError
        ? `${err.message}${err.status ? ` (${err.status})` : ""}`
        : err instanceof Error
          ? err.message
          : "Erro ao enviar";
    await marcarFalha(supabase, msgId, message);
    return { ok: false, reason: "erro", error: message, msgId };
  }
}

async function marcarFalha(supabase: SBAny, msgId: string, erro: string) {
  await supabase
    .from("whatsapp_msgs")
    .update({ status: "falhou", erro })
    .eq("id", msgId);
}

/**
 * Checagem leve de status da instância. Retorna `null` se Evolution
 * não estiver configurada (deve ser tratado como "desconectado").
 */
export async function getStatusConexao(): Promise<EvolutionInstanceStatus | null> {
  let evolution: EvolutionClient;
  try {
    evolution = createEvolutionClient(evolutionConfigFromEnv());
  } catch {
    return null;
  }
  try {
    return await evolution.getInstanceStatus();
  } catch (err) {
    console.error("getStatusConexao:", err);
    return { state: "unknown", raw: null };
  }
}
