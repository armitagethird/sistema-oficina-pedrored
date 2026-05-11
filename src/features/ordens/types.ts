import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type OS = Tables<"ordens_servico">;
export type OSInsert = TablesInsert<"ordens_servico">;
export type OSUpdate = TablesUpdate<"ordens_servico">;
export type OSStatus = Database["public"]["Enums"]["os_status"];

export type OsServico = Tables<"os_servicos">;
export type OsServicoInsert = TablesInsert<"os_servicos">;
export type OsServicoUpdate = TablesUpdate<"os_servicos">;

export type OsPeca = Tables<"os_pecas">;
export type OsPecaInsert = TablesInsert<"os_pecas">;
export type OsPecaUpdate = TablesUpdate<"os_pecas">;
export type PecaOrigem = Database["public"]["Enums"]["peca_origem"];
export type PecaStatus = Database["public"]["Enums"]["peca_status"];

export type OsFoto = Tables<"os_fotos">;
export type FotoMomento = Database["public"]["Enums"]["foto_momento"];

export const OS_STATUS_VALUES: readonly OSStatus[] = [
  "aberta",
  "em_andamento",
  "aguardando_peca",
  "pronta",
  "entregue",
  "cancelada",
] as const;

export const PECA_ORIGEM_VALUES: readonly PecaOrigem[] = [
  "estoque",
  "fornecedor",
  "mercado_livre_afiliado",
] as const;

export const PECA_STATUS_VALUES: readonly PecaStatus[] = [
  "pendente",
  "comprada",
  "recebida",
  "aplicada",
] as const;

export const FOTO_MOMENTO_VALUES: readonly FotoMomento[] = [
  "entrada",
  "saida",
  "durante",
] as const;

export const STATUS_LABEL: Record<OSStatus, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando_peca: "Aguardando peça",
  pronta: "Pronta",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

export const PECA_STATUS_LABEL: Record<PecaStatus, string> = {
  pendente: "Pendente",
  comprada: "Comprada",
  recebida: "Recebida",
  aplicada: "Aplicada",
};

export const PECA_ORIGEM_LABEL: Record<PecaOrigem, string> = {
  estoque: "Estoque",
  fornecedor: "Fornecedor",
  mercado_livre_afiliado: "Mercado Livre (afiliado)",
};

export const MOMENTO_LABEL: Record<FotoMomento, string> = {
  entrada: "Entrada",
  saida: "Saída",
  durante: "Durante",
};

const TRANSITIONS: Record<OSStatus, readonly OSStatus[]> = {
  aberta: ["em_andamento", "cancelada"],
  em_andamento: ["aguardando_peca", "pronta", "cancelada"],
  aguardando_peca: ["em_andamento", "cancelada"],
  pronta: ["em_andamento", "entregue", "cancelada"],
  entregue: [],
  cancelada: [],
};

export function isTransitionAllowed(from: OSStatus, to: OSStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getNextStatuses(from: OSStatus): readonly OSStatus[] {
  return TRANSITIONS[from];
}
