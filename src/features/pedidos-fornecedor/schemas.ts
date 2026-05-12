import { z } from "zod";

import { PEDIDO_STATUS_VALUES } from "./types";

export const pedidoCreateSchema = z.object({
  fornecedor_id: z.string().uuid("Selecione um fornecedor"),
  os_id: z.string().uuid().optional().nullable(),
  status: z.enum(PEDIDO_STATUS_VALUES as readonly [string, ...string[]]),
  data_compra: z.string().optional().nullable(),
  data_recebimento: z.string().optional().nullable(),
  observacoes: z.string().optional(),
});

export const pedidoUpdateSchema = pedidoCreateSchema.partial();

export type PedidoCreateInput = z.infer<typeof pedidoCreateSchema>;
export type PedidoUpdateInput = z.infer<typeof pedidoUpdateSchema>;

export const pedidoItemCreateSchema = z.object({
  descricao: z.string().trim().min(1, "Descrição obrigatória").max(200),
  custo_unitario: z.coerce.number().min(0, "Custo inválido"),
  quantidade: z.coerce.number().gt(0, "Quantidade deve ser maior que zero"),
  os_peca_id: z.string().uuid().optional().nullable(),
});

export const pedidoItemUpdateSchema = pedidoItemCreateSchema.partial();

export type PedidoItemCreateInput = z.infer<typeof pedidoItemCreateSchema>;
export type PedidoItemUpdateInput = z.infer<typeof pedidoItemUpdateSchema>;

function emptyToNull(v: string | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizePedidoInput(input: PedidoCreateInput | PedidoUpdateInput) {
  return {
    os_id: input.os_id ?? null,
    data_compra: emptyToNull(input.data_compra ?? null),
    data_recebimento: emptyToNull(input.data_recebimento ?? null),
    observacoes: emptyToNull(input.observacoes ?? null),
  };
}
