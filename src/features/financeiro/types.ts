import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type Pagamento = Tables<"pagamentos">;
export type PagamentoInsert = TablesInsert<"pagamentos">;
export type PagamentoUpdate = TablesUpdate<"pagamentos">;
export type PagamentoStatus = Database["public"]["Enums"]["pagamento_status"];
export type PagamentoMetodo = Database["public"]["Enums"]["pagamento_metodo"];

export type ContasReceberRow = Tables<"view_contas_a_receber">;
export type CapitalInvestidoRow = Tables<"view_capital_investido">;

export const PAGAMENTO_STATUS_VALUES: readonly PagamentoStatus[] = [
  "pendente",
  "pago",
  "atrasado",
  "cancelado",
] as const;

export const PAGAMENTO_METODO_VALUES: readonly PagamentoMetodo[] = [
  "pix",
  "dinheiro",
  "cartao",
  "transferencia",
] as const;

export const PAGAMENTO_STATUS_LABEL: Record<PagamentoStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const PAGAMENTO_METODO_LABEL: Record<PagamentoMetodo, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
};
