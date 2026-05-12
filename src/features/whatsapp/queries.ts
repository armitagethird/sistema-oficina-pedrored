import { createClient } from "@/lib/supabase/server";

import { SETTINGS_KEYS } from "./constants";
import type {
  WhatsappJobCron,
  WhatsappMsg,
  WhatsappTemplate,
  WhatsappTemplateTipo,
} from "./types";

export async function getTemplates(): Promise<WhatsappTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .order("tipo");
  if (error) {
    console.error("getTemplates:", error);
    return [];
  }
  return (data ?? []) as WhatsappTemplate[];
}

export async function getTemplate(
  tipo: WhatsappTemplateTipo,
): Promise<WhatsappTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .eq("tipo", tipo)
    .maybeSingle();
  if (error) {
    console.error("getTemplate:", error);
    return null;
  }
  return (data ?? null) as WhatsappTemplate | null;
}

export interface WhatsappConfig {
  envios_ativos: boolean;
  oleo_km_intervalo: number;
  oleo_km_antecedencia: number;
  oleo_km_dia: number;
}

export async function getConfig(): Promise<WhatsappConfig> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("chave, valor")
    .in("chave", [
      SETTINGS_KEYS.enviosAtivos,
      SETTINGS_KEYS.oleoKmIntervalo,
      SETTINGS_KEYS.oleoKmAntecedencia,
      SETTINGS_KEYS.oleoKmDia,
    ]);
  if (error) {
    console.error("getConfig:", error);
  }
  const map = Object.fromEntries(
    (data ?? []).map((s) => [s.chave, s.valor as string]),
  );
  return {
    envios_ativos: (map[SETTINGS_KEYS.enviosAtivos] ?? "true").toLowerCase() !== "false",
    oleo_km_intervalo: parseInt(map[SETTINGS_KEYS.oleoKmIntervalo] ?? "10000", 10),
    oleo_km_antecedencia: parseInt(
      map[SETTINGS_KEYS.oleoKmAntecedencia] ?? "500",
      10,
    ),
    oleo_km_dia: parseInt(map[SETTINGS_KEYS.oleoKmDia] ?? "30", 10),
  };
}

export interface ConversaResumo {
  cliente_id: string | null;
  telefone: string;
  cliente_nome: string | null;
  ultima_msg: string;
  ultima_em: string;
  ultima_direcao: "in" | "out";
  total_msgs: number;
}

export async function listConversas(): Promise<ConversaResumo[]> {
  const supabase = await createClient();
  const { data: msgs, error } = await supabase
    .from("whatsapp_msgs")
    .select(
      "telefone, cliente_id, direcao, conteudo, criado_em, clientes(nome)",
    )
    .order("criado_em", { ascending: false })
    .limit(500);

  if (error || !msgs) {
    console.error("listConversas:", error);
    return [];
  }

  const map = new Map<string, ConversaResumo>();
  for (const row of msgs as Array<{
    telefone: string;
    cliente_id: string | null;
    direcao: "in" | "out";
    conteudo: string;
    criado_em: string;
    clientes: { nome: string } | { nome: string }[] | null;
  }>) {
    const key = row.cliente_id ?? `tel:${row.telefone}`;
    const nome = Array.isArray(row.clientes)
      ? (row.clientes[0]?.nome ?? null)
      : (row.clientes?.nome ?? null);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        cliente_id: row.cliente_id,
        telefone: row.telefone,
        cliente_nome: nome,
        ultima_msg: row.conteudo,
        ultima_em: row.criado_em,
        ultima_direcao: row.direcao,
        total_msgs: 1,
      });
    } else {
      existing.total_msgs += 1;
    }
  }

  return [...map.values()].sort((a, b) =>
    a.ultima_em < b.ultima_em ? 1 : -1,
  );
}

export async function getMsgsByCliente(
  clienteId: string,
  limit = 200,
): Promise<WhatsappMsg[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_msgs")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("getMsgsByCliente:", error);
    return [];
  }
  return (data ?? []) as WhatsappMsg[];
}

export async function getMsgsByTelefone(
  telefone: string,
  limit = 200,
): Promise<WhatsappMsg[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_msgs")
    .select("*")
    .eq("telefone", telefone)
    .order("criado_em", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("getMsgsByTelefone:", error);
    return [];
  }
  return (data ?? []) as WhatsappMsg[];
}

export interface MetricasEnvio {
  hoje_enviadas: number;
  hoje_falharam: number;
  semana_enviadas: number;
  semana_falharam: number;
  total_recebidas_7d: number;
}

export async function getMetricasEnvio(): Promise<MetricasEnvio> {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const todayIso = todayStart.toISOString();
  const weekIso = weekStart.toISOString();
  const okStatuses: Array<"enviada" | "entregue" | "lida"> = [
    "enviada",
    "entregue",
    "lida",
  ];

  const [hojeEnv, hojeFalha, semanaEnv, semanaFalha, semanaIn] = await Promise.all([
    supabase
      .from("whatsapp_msgs")
      .select("*", { count: "exact", head: true })
      .eq("direcao", "out")
      .in("status", okStatuses)
      .gte("criado_em", todayIso),
    supabase
      .from("whatsapp_msgs")
      .select("*", { count: "exact", head: true })
      .eq("direcao", "out")
      .eq("status", "falhou")
      .gte("criado_em", todayIso),
    supabase
      .from("whatsapp_msgs")
      .select("*", { count: "exact", head: true })
      .eq("direcao", "out")
      .in("status", okStatuses)
      .gte("criado_em", weekIso),
    supabase
      .from("whatsapp_msgs")
      .select("*", { count: "exact", head: true })
      .eq("direcao", "out")
      .eq("status", "falhou")
      .gte("criado_em", weekIso),
    supabase
      .from("whatsapp_msgs")
      .select("*", { count: "exact", head: true })
      .eq("direcao", "in")
      .gte("criado_em", weekIso),
  ]);

  function n(res: { count: number | null; error: unknown }) {
    if (res.error) console.error("getMetricasEnvio:", res.error);
    return res.count ?? 0;
  }

  return {
    hoje_enviadas: n(hojeEnv),
    hoje_falharam: n(hojeFalha),
    semana_enviadas: n(semanaEnv),
    semana_falharam: n(semanaFalha),
    total_recebidas_7d: n(semanaIn),
  };
}

export async function listJobsRecentes(limit = 30): Promise<WhatsappJobCron[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_jobs_cron")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listJobsRecentes:", error);
    return [];
  }
  return (data ?? []) as WhatsappJobCron[];
}
