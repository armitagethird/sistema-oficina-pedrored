import { z } from "zod";

import {
  PEDIDO_LOJA_STATUS_VALUES,
  PRODUTO_STATUS_VALUES,
} from "./types";

export const enderecoSchema = z.object({
  cep: z.string().trim().min(8, "CEP inválido").max(10),
  rua: z.string().trim().min(1, "Rua obrigatória").max(120),
  numero: z.string().trim().min(1, "Número obrigatório").max(20),
  bairro: z.string().trim().min(1, "Bairro obrigatório").max(80),
  cidade: z.string().trim().min(1, "Cidade obrigatória").max(80),
  uf: z.string().trim().length(2, "UF inválida"),
  complemento: z.string().max(120).optional().nullable(),
});

const produtoBaseSchema = z.object({
  titulo: z.string().trim().min(2, "Título obrigatório").max(160),
  descricao: z.string().max(2000).optional().nullable(),
  preco: z.number().nonnegative("Preço inválido"),
  preco_promocional: z.number().nonnegative().optional().nullable(),
  estoque_manual: z.number().int().nonnegative().optional().nullable(),
  frete_info: z.string().max(200).optional().nullable(),
  status: z
    .enum(PRODUTO_STATUS_VALUES as readonly [string, ...string[]])
    .optional(),
  destaque: z.boolean().optional(),
  ordem_destaque: z.number().int().optional().nullable(),
  item_estoque_id: z.string().uuid().optional().nullable(),
  somente_sob_encomenda: z.boolean().optional(),
  fotos: z.array(z.string()).optional(),
});

const sobEncomendaSemEstoque = (data: {
  somente_sob_encomenda?: boolean;
  item_estoque_id?: string | null;
}) => !(data.somente_sob_encomenda && data.item_estoque_id);

const sobEncomendaIssue = {
  message: "Produto sob encomenda não pode estar vinculado a item de estoque",
  path: ["somente_sob_encomenda"],
};

export const produtoCreateSchema = produtoBaseSchema.refine(
  sobEncomendaSemEstoque,
  sobEncomendaIssue,
);

export const produtoEditSchema = produtoBaseSchema
  .partial()
  .refine(sobEncomendaSemEstoque, sobEncomendaIssue);

export const itemPedidoSchema = z.object({
  produto_id: z.string().uuid("Produto inválido"),
  quantidade: z.number().int().gt(0, "Quantidade inválida"),
});

export const pedidoCreateSchema = z.object({
  cliente_nome: z.string().trim().min(2, "Nome obrigatório").max(120),
  cliente_telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  cliente_email: z.string().email("Email inválido").optional().nullable(),
  cliente_endereco: enderecoSchema,
  observacoes_cliente: z.string().max(500).optional().nullable(),
  itens: z.array(itemPedidoSchema).min(1, "Carrinho vazio"),
});

export const pedidoLojaStatusSchema = z.object({
  novo_status: z.enum(
    PEDIDO_LOJA_STATUS_VALUES as readonly [string, ...string[]],
  ),
});

export type ProdutoCreateInput = z.infer<typeof produtoCreateSchema>;
export type ProdutoEditInput = z.infer<typeof produtoEditSchema>;
export type PedidoCreateInput = z.infer<typeof pedidoCreateSchema>;
export type EnderecoInput = z.infer<typeof enderecoSchema>;
export type ItemPedidoInput = z.infer<typeof itemPedidoSchema>;
