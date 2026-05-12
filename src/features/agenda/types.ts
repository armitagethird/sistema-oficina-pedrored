import type { Database } from "@/lib/supabase/database.types";

export type AgendaPeriodo = Database["public"]["Enums"]["agenda_periodo"];
export type AgendaStatus = Database["public"]["Enums"]["agenda_status"];

export type Agendamento =
  Database["public"]["Tables"]["agendamentos"]["Row"];
export type AgendamentoInsert =
  Database["public"]["Tables"]["agendamentos"]["Insert"];
export type AgendamentoUpdate =
  Database["public"]["Tables"]["agendamentos"]["Update"];

export type CapacidadeOverride =
  Database["public"]["Tables"]["capacidade_overrides"]["Row"];

export type OcupacaoDia = {
  capacidade_padrao: number;
  capacidade_override: number | null;
  capacidade_efetiva: number;
  ocupados: number;
  disponivel: number;
};

export type AgendamentoComRelacoes = Agendamento & {
  clientes: { nome: string; telefone: string | null } | null;
  veiculos: { modelo: string; placa: string | null } | null;
};

const TRANSITIONS: Record<AgendaStatus, readonly AgendaStatus[]> = {
  agendado: ["confirmado", "cancelado", "nao_compareceu"],
  confirmado: ["em_andamento", "cancelado", "nao_compareceu"],
  em_andamento: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
  nao_compareceu: [],
};

export function isTransitionAllowed(
  from: AgendaStatus,
  to: AgendaStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getNextStatuses(current: AgendaStatus): AgendaStatus[] {
  return [...TRANSITIONS[current]];
}

export const STATUS_LABEL: Record<AgendaStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

export const STATUS_COLOR: Record<
  AgendaStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  agendado: "secondary",
  confirmado: "default",
  em_andamento: "default",
  concluido: "outline",
  cancelado: "destructive",
  nao_compareceu: "destructive",
};

export const PERIODO_LABEL: Record<AgendaPeriodo, string> = {
  manha: "Manhã",
  tarde: "Tarde",
};
