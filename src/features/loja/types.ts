import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type Produto = Tables<"produtos_loja">;
export type ProdutoInsert = TablesInsert<"produtos_loja">;
export type ProdutoUpdate = TablesUpdate<"produtos_loja">;
export type ProdutoStatus = Database["public"]["Enums"]["produto_status"];

export type PedidoLoja = Tables<"pedidos_loja">;
export type PedidoLojaInsert = TablesInsert<"pedidos_loja">;
export type PedidoLojaUpdate = TablesUpdate<"pedidos_loja">;
export type PedidoLojaStatus =
  Database["public"]["Enums"]["pedido_loja_status"];

export type ItemPedidoLoja = Tables<"itens_pedido_loja">;
export type ItemPedidoLojaInsert = TablesInsert<"itens_pedido_loja">;

export type EnderecoCliente = {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string | null;
};

export const PRODUTO_STATUS_VALUES: readonly ProdutoStatus[] = [
  "ativo",
  "inativo",
  "esgotado",
] as const;

export const PRODUTO_STATUS_LABEL: Record<ProdutoStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  esgotado: "Esgotado",
};

export const PEDIDO_LOJA_STATUS_VALUES: readonly PedidoLojaStatus[] = [
  "aguardando_pagamento",
  "pagamento_em_analise",
  "pago",
  "em_separacao",
  "enviado",
  "retirado",
  "cancelado",
] as const;

export const PEDIDO_LOJA_STATUS_LABEL: Record<PedidoLojaStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pagamento_em_analise: "Pagamento em análise",
  pago: "Pago",
  em_separacao: "Em separação",
  enviado: "Enviado",
  retirado: "Retirado",
  cancelado: "Cancelado",
};

const TRANSITIONS: Record<PedidoLojaStatus, readonly PedidoLojaStatus[]> = {
  aguardando_pagamento: ["pagamento_em_analise", "pago", "cancelado"],
  pagamento_em_analise: ["pago", "aguardando_pagamento", "cancelado"],
  pago: ["em_separacao", "cancelado"],
  em_separacao: ["enviado", "retirado", "cancelado"],
  enviado: ["retirado"],
  retirado: [],
  cancelado: [],
};

export function isPedidoLojaTransitionAllowed(
  from: PedidoLojaStatus,
  to: PedidoLojaStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getNextPedidoLojaStatuses(
  from: PedidoLojaStatus,
): readonly PedidoLojaStatus[] {
  return TRANSITIONS[from];
}
