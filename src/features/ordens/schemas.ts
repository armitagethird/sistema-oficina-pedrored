import { z } from "zod";

import {
  FOTO_MOMENTO_VALUES,
  OS_STATUS_VALUES,
  PECA_ORIGEM_VALUES,
  PECA_STATUS_VALUES,
} from "./types";

export const osCreateSchema = z.object({
  cliente_id: z.string().uuid("Cliente inválido"),
  veiculo_id: z.string().uuid("Veículo inválido"),
  descricao_problema: z
    .string()
    .trim()
    .min(3, "Descreva o problema")
    .max(2000),
  km_entrada: z.number().int().min(0).optional().nullable(),
  observacoes: z.string().optional(),
});

export const osHeaderUpdateSchema = z
  .object({
    descricao_problema: z.string().trim().min(3).max(2000).optional(),
    km_entrada: z.number().int().min(0).optional().nullable(),
    km_saida: z.number().int().min(0).optional().nullable(),
    observacoes: z.string().optional().nullable(),
  })
  .partial();

export const mudarStatusSchema = z.object({
  novo_status: z.enum(OS_STATUS_VALUES as unknown as [string, ...string[]]),
  km_saida: z.number().int().min(0).optional(),
});

export const servicoSchema = z.object({
  descricao: z.string().trim().min(2, "Descrição muito curta").max(200),
  valor_unitario: z.number().min(0, "Valor inválido"),
  quantidade: z.number().min(0.01, "Quantidade inválida"),
});

export const servicoUpdateSchema = servicoSchema.partial();

export const pecaSchema = z.object({
  descricao: z.string().trim().min(2, "Descrição muito curta").max(200),
  origem: z.enum(PECA_ORIGEM_VALUES as unknown as [string, ...string[]]),
  custo_unitario: z.number().min(0, "Custo inválido"),
  preco_venda_unitario: z.number().min(0, "Preço inválido"),
  quantidade: z.number().min(0.01, "Quantidade inválida"),
  link_ml: z.string().url("URL inválida").optional().or(z.literal("")).nullable(),
  fornecedor_nome: z.string().optional().nullable(),
  status: z
    .enum(PECA_STATUS_VALUES as unknown as [string, ...string[]])
    .optional(),
  item_estoque_id: z.string().uuid().nullable().optional(),
});

export const pecaUpdateSchema = pecaSchema.partial();

export const mudarStatusPecaSchema = z.object({
  novo_status: z.enum(
    PECA_STATUS_VALUES as unknown as [string, ...string[]],
  ),
});

export const uploadFotoSchema = z.object({
  momento: z.enum(FOTO_MOMENTO_VALUES as unknown as [string, ...string[]]),
  legenda: z.string().optional(),
});

export type OsCreateInput = z.infer<typeof osCreateSchema>;
export type OsHeaderUpdateInput = z.infer<typeof osHeaderUpdateSchema>;
export type ServicoInput = z.infer<typeof servicoSchema>;
export type ServicoUpdateInput = z.infer<typeof servicoUpdateSchema>;
export type PecaInput = z.infer<typeof pecaSchema>;
export type PecaUpdateInput = z.infer<typeof pecaUpdateSchema>;
