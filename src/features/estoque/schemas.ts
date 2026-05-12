import { z } from "zod";

import { UNIDADES } from "./types";

export const itemCreateSchema = z.object({
  categoria_id: z.string().uuid("Categoria inválida"),
  descricao: z.string().min(1, "Descrição obrigatória").max(200),
  sku: z.string().max(80).optional().nullable(),
  unidade: z.enum(UNIDADES as readonly [string, ...string[]]),
  preco_venda: z.number().nonnegative("Preço de venda inválido"),
  alerta_minimo: z.number().nonnegative().default(0),
  observacoes: z.string().max(500).optional().nullable(),
});

export const itemEditSchema = z.object({
  categoria_id: z.string().uuid().optional(),
  descricao: z.string().min(1).max(200).optional(),
  sku: z.string().max(80).optional().nullable(),
  unidade: z.enum(UNIDADES as readonly [string, ...string[]]).optional(),
  preco_venda: z.number().nonnegative().optional(),
  alerta_minimo: z.number().nonnegative().optional(),
  observacoes: z.string().max(500).optional().nullable(),
  ativo: z.boolean().optional(),
});

export const entradaSchema = z.object({
  item_id: z.string().uuid("Item inválido"),
  quantidade: z.number().gt(0, "Quantidade deve ser maior que zero"),
  custo_unitario: z.number().nonnegative("Custo inválido"),
  pedido_fornecedor_id: z.string().uuid().nullable().optional(),
});

export const saidaSchema = z.object({
  item_id: z.string().uuid("Item inválido"),
  quantidade: z.number().gt(0, "Quantidade deve ser maior que zero"),
  motivo: z.string().max(200).optional().nullable(),
});

export const ajusteSchema = z.object({
  item_id: z.string().uuid("Item inválido"),
  quantidade: z.number().gt(0, "Quantidade deve ser maior que zero"),
  motivo: z.string().min(1, "Motivo obrigatório").max(200),
});

export const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(80),
  ordem: z.number().int().default(0),
});

export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type ItemEditInput = z.infer<typeof itemEditSchema>;
export type EntradaInput = z.infer<typeof entradaSchema>;
export type SaidaInput = z.infer<typeof saidaSchema>;
export type AjusteInput = z.infer<typeof ajusteSchema>;
export type CategoriaInput = z.infer<typeof categoriaSchema>;
