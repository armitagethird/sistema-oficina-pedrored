import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  AgendamentoComRelacoes,
  AgendaStatus,
  CapacidadeOverride,
  OcupacaoDia,
} from "./types";

export type AgendamentosHoje = {
  manha: AgendamentoComRelacoes[];
  tarde: AgendamentoComRelacoes[];
};

const AGENDAMENTO_SELECT = `
  *,
  clientes(nome, telefone),
  veiculos(modelo, placa)
` as const;

export async function getAgendamentosHoje(): Promise<AgendamentosHoje> {
  const supabase = await createClient();
  const hoje = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_SELECT)
    .eq("data", hoje)
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("getAgendamentosHoje:", error);
    return { manha: [], tarde: [] };
  }

  const records = (data ?? []) as AgendamentoComRelacoes[];
  return {
    manha: records.filter((a) => a.periodo === "manha"),
    tarde: records.filter((a) => a.periodo === "tarde"),
  };
}

export async function getAgendamentosSemana(
  dataInicio: string,
  dataFim: string,
): Promise<AgendamentoComRelacoes[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_SELECT)
    .gte("data", dataInicio)
    .lte("data", dataFim)
    .order("data", { ascending: true })
    .order("periodo", { ascending: true });

  if (error) {
    console.error("getAgendamentosSemana:", error);
    return [];
  }

  return (data ?? []) as AgendamentoComRelacoes[];
}

export async function getAgendamentosMes(
  ano: number,
  mes: number,
): Promise<AgendamentoComRelacoes[]> {
  const supabase = await createClient();
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_SELECT)
    .gte("data", dataInicio)
    .lte("data", dataFim)
    .order("data", { ascending: true });

  if (error) {
    console.error("getAgendamentosMes:", error);
    return [];
  }

  return (data ?? []) as AgendamentoComRelacoes[];
}

export async function getAgendamento(
  id: string,
): Promise<AgendamentoComRelacoes | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getAgendamento:", error);
    return null;
  }

  return data as AgendamentoComRelacoes | null;
}

export async function getOcupacaoDia(
  data: string,
  periodo: "manha" | "tarde",
): Promise<OcupacaoDia | null> {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("ocupacao_dia", {
    p_data: data,
    p_periodo: periodo,
  });

  if (error) {
    console.error("getOcupacaoDia:", error);
    return null;
  }

  return (result?.[0] as OcupacaoDia) ?? null;
}

export async function getSettingsCapacidade(): Promise<{
  manha: number;
  tarde: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("chave, valor")
    .in("chave", ["agenda_capacidade_manha", "agenda_capacidade_tarde"]);

  if (error) {
    console.error("getSettingsCapacidade:", error);
    return { manha: 3, tarde: 3 };
  }

  const map = Object.fromEntries((data ?? []).map((s) => [s.chave, s.valor]));
  return {
    manha: parseInt(map["agenda_capacidade_manha"] ?? "3", 10),
    tarde: parseInt(map["agenda_capacidade_tarde"] ?? "3", 10),
  };
}

export async function getCapacidadeOverridesMes(
  ano: number,
  mes: number,
): Promise<CapacidadeOverride[]> {
  const supabase = await createClient();
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

  const { data, error } = await supabase
    .from("capacidade_overrides")
    .select("*")
    .gte("data", dataInicio)
    .lte("data", dataFim);

  if (error) {
    console.error("getCapacidadeOverridesMes:", error);
    return [];
  }

  return data ?? [];
}

export async function getStatusCount(
  data: string,
): Promise<Record<AgendaStatus, number>> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("data", data);

  if (error) {
    console.error("getStatusCount:", error);
  }

  const counts: Record<AgendaStatus, number> = {
    agendado: 0,
    confirmado: 0,
    em_andamento: 0,
    concluido: 0,
    cancelado: 0,
    nao_compareceu: 0,
  };

  for (const row of rows ?? []) {
    counts[row.status as AgendaStatus]++;
  }

  return counts;
}
