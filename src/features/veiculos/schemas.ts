import { z } from "zod";

export const veiculoCreateSchema = z
  .object({
    cliente_id: z.string().uuid("Cliente inválido"),
    modelo_id: z.string().uuid().optional().nullable(),
    modelo_custom: z.string().optional(),
    motor: z.string().optional(),
    ano: z
      .number()
      .int()
      .min(1950, "Ano muito antigo")
      .max(new Date().getFullYear() + 1, "Ano futuro inválido")
      .optional()
      .nullable(),
    placa: z.string().optional(),
    cor: z.string().optional(),
    km_atual: z.number().int().min(0, "KM inválida").optional(),
    observacoes: z.string().optional(),
  })
  .refine(
    (v) => Boolean(v.modelo_id) || Boolean(v.modelo_custom?.trim()),
    {
      message: "Selecione um modelo VW ou informe o modelo manualmente",
      path: ["modelo_custom"],
    },
  );

export const veiculoUpdateSchema = z
  .object({
    cliente_id: z.string().uuid().optional(),
    modelo_id: z.string().uuid().optional().nullable(),
    modelo_custom: z.string().optional(),
    motor: z.string().optional(),
    ano: z
      .number()
      .int()
      .min(1950)
      .max(new Date().getFullYear() + 1)
      .optional()
      .nullable(),
    placa: z.string().optional(),
    cor: z.string().optional(),
    km_atual: z.number().int().min(0).optional(),
    observacoes: z.string().optional(),
  })
  .partial();

export type VeiculoCreateInput = z.infer<typeof veiculoCreateSchema>;
export type VeiculoUpdateInput = z.infer<typeof veiculoUpdateSchema>;

function emptyToNull(v: string | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizeVeiculoInput(
  input: VeiculoCreateInput | VeiculoUpdateInput,
) {
  return {
    modelo_id: input.modelo_id || null,
    modelo_custom: emptyToNull(input.modelo_custom),
    motor: emptyToNull(input.motor),
    ano: input.ano ?? null,
    placa: emptyToNull(input.placa)?.toUpperCase() ?? null,
    cor: emptyToNull(input.cor),
    km_atual: input.km_atual ?? 0,
    observacoes: emptyToNull(input.observacoes),
  };
}
