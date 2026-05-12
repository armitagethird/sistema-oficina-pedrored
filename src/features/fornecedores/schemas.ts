import { z } from "zod";

const emailOptional = z
  .string()
  .optional()
  .refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Email inválido",
  );

export const fornecedorCreateSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(120),
  telefone: z.string().optional(),
  email: emailOptional,
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

export const fornecedorUpdateSchema = fornecedorCreateSchema.partial();

export type FornecedorCreateInput = z.infer<typeof fornecedorCreateSchema>;
export type FornecedorUpdateInput = z.infer<typeof fornecedorUpdateSchema>;

function emptyToNull(v: string | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizeFornecedorInput(
  input: FornecedorCreateInput | FornecedorUpdateInput,
) {
  return {
    telefone: emptyToNull(input.telefone),
    email: emptyToNull(input.email),
    cnpj: emptyToNull(input.cnpj),
    endereco: emptyToNull(input.endereco),
    observacoes: emptyToNull(input.observacoes),
  };
}
