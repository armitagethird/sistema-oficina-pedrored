import { z } from "zod";

export const linkCreateSchema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente"),
  os_id: z.string().uuid().optional().nullable(),
  link: z
    .string()
    .trim()
    .min(1, "Link obrigatório")
    .max(2000, "Link muito longo")
    .refine(
      (v) => /^https?:\/\/.+/.test(v),
      "Use uma URL completa (https://...)",
    ),
  descricao_peca: z.string().trim().min(1, "Descrição obrigatória").max(200),
  preco_estimado: z.number().min(0).optional().nullable(),
  comissao_estimada: z.number().min(0).optional().nullable(),
  observacoes: z.string().optional(),
});

export const linkUpdateSchema = linkCreateSchema.partial();

export const marcarComissaoSchema = z.object({
  comissao_recebida: z.number().min(0, "Comissão não pode ser negativa"),
});

export type LinkCreateInput = z.infer<typeof linkCreateSchema>;
export type LinkUpdateInput = z.infer<typeof linkUpdateSchema>;
export type MarcarComissaoInput = z.infer<typeof marcarComissaoSchema>;
