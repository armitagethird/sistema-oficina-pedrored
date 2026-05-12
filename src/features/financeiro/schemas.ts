import { z } from "zod";

import { PAGAMENTO_METODO_VALUES } from "./types";

export const pagamentoCreateSchema = z.object({
  os_id: z.string().uuid("OS inválida"),
  ordem: z.number().int().min(1),
  valor: z.number().gt(0, "Valor deve ser maior que zero"),
  metodo: z.enum(PAGAMENTO_METODO_VALUES as readonly [string, ...string[]]),
  data_prevista: z.string().optional().nullable(),
  observacoes: z.string().optional(),
});

export const pagamentoEditSchema = z.object({
  valor: z.number().gt(0, "Valor deve ser maior que zero").optional(),
  metodo: z.enum(PAGAMENTO_METODO_VALUES as readonly [string, ...string[]]).optional(),
  data_prevista: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export const parcelaItemSchema = z.object({
  valor: z.number().gt(0, "Valor deve ser maior que zero"),
  metodo: z.enum(PAGAMENTO_METODO_VALUES as readonly [string, ...string[]]),
  data_prevista: z.string().optional().nullable(),
});

export const criarParcelasSchema = z.object({
  os_id: z.string().uuid("OS inválida"),
  parcelas: z
    .array(parcelaItemSchema)
    .min(1, "Pelo menos uma parcela é necessária"),
});

export type PagamentoCreateInput = z.infer<typeof pagamentoCreateSchema>;
export type PagamentoEditInput = z.infer<typeof pagamentoEditSchema>;
export type ParcelaItemInput = z.infer<typeof parcelaItemSchema>;
export type CriarParcelasInput = z.infer<typeof criarParcelasSchema>;
