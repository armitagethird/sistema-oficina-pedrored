import { z } from "zod";

import { PLACEHOLDERS_VALIDOS } from "./constants";

const WHATSAPP_TEMPLATE_TIPOS = [
  "lembrete_d1",
  "os_pronta",
  "cobranca_atraso_3",
  "cobranca_atraso_7",
  "cobranca_atraso_15",
  "lembrete_oleo_km",
  "manual",
] as const;

const telefoneSchema = z
  .string()
  .trim()
  .min(8, "Telefone inválido")
  .max(20, "Telefone inválido");

export const enviarMensagemSchema = z.object({
  telefone: telefoneSchema,
  conteudo: z.string().trim().min(1, "Mensagem vazia").max(1500, "Mensagem muito longa"),
  template_tipo: z.enum(WHATSAPP_TEMPLATE_TIPOS).optional(),
  cliente_id: z.string().uuid().optional(),
  os_id: z.string().uuid().optional(),
  agendamento_id: z.string().uuid().optional(),
  pagamento_id: z.string().uuid().optional(),
});

export type EnviarMensagemInput = z.infer<typeof enviarMensagemSchema>;

export const atualizarTemplateSchema = z.object({
  tipo: z.enum(WHATSAPP_TEMPLATE_TIPOS),
  template_texto: z
    .string()
    .trim()
    .min(1, "Texto não pode ficar vazio")
    .max(1500, "Texto muito longo"),
  ativo: z.boolean().optional(),
});

export type AtualizarTemplateInput = z.infer<typeof atualizarTemplateSchema>;

export const configWhatsappSchema = z.object({
  envios_ativos: z.boolean().optional(),
  oleo_km_intervalo: z.number().int().positive().optional(),
  oleo_km_antecedencia: z.number().int().nonnegative().optional(),
  oleo_km_dia: z.number().int().positive().optional(),
});

export type ConfigWhatsappInput = z.infer<typeof configWhatsappSchema>;

/**
 * Variáveis passadas ao engine `renderTemplate`. Tudo string para evitar
 * problemas de formatação numérica (callers já formatam moeda/data antes).
 */
export const templateVarsSchema = z
  .object(
    Object.fromEntries(
      PLACEHOLDERS_VALIDOS.map((k) => [k, z.string().optional()] as const),
    ) as Record<(typeof PLACEHOLDERS_VALIDOS)[number], z.ZodOptional<z.ZodString>>,
  )
  .partial();

export type TemplateVars = z.infer<typeof templateVarsSchema>;
