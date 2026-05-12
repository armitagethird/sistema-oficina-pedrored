import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type Pedido = Tables<"pedidos_fornecedor">;
export type PedidoInsert = TablesInsert<"pedidos_fornecedor">;
export type PedidoUpdate = TablesUpdate<"pedidos_fornecedor">;
export type PedidoStatus = Database["public"]["Enums"]["pedido_fornecedor_status"];

export type PedidoItem = Tables<"pedido_fornecedor_itens">;
export type PedidoItemInsert = TablesInsert<"pedido_fornecedor_itens">;
export type PedidoItemUpdate = TablesUpdate<"pedido_fornecedor_itens">;

export const PEDIDO_STATUS_VALUES: readonly PedidoStatus[] = [
  "cotacao",
  "comprado",
  "recebido",
  "cancelado",
] as const;

export const PEDIDO_STATUS_LABEL: Record<PedidoStatus, string> = {
  cotacao: "Cotação",
  comprado: "Comprado",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

const TRANSITIONS: Record<PedidoStatus, readonly PedidoStatus[]> = {
  cotacao: ["comprado", "cancelado"],
  comprado: ["recebido", "cancelado"],
  recebido: [],
  cancelado: [],
};

export function isPedidoTransitionAllowed(
  from: PedidoStatus,
  to: PedidoStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getNextPedidoStatuses(from: PedidoStatus): readonly PedidoStatus[] {
  return TRANSITIONS[from];
}
