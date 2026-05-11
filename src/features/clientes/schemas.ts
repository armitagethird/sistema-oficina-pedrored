import { z } from "zod";

const emailOptional = z
  .string()
  .optional()
  .refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Email inválido",
  );

const enderecoSchema = z
  .object({
    rua: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    cep: z.string().optional(),
    complemento: z.string().optional(),
  })
  .optional();

export const clienteCreateSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(120),
  telefone: z.string().optional(),
  email: emailOptional,
  cpf: z.string().optional(),
  endereco: enderecoSchema,
  observacoes: z.string().optional(),
});

export const clienteUpdateSchema = clienteCreateSchema.partial();

export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;

function emptyToNull(v: string | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizeClienteInput(input: ClienteCreateInput | ClienteUpdateInput) {
  return {
    telefone: emptyToNull(input.telefone),
    email: emptyToNull(input.email),
    cpf: emptyToNull(input.cpf),
    endereco: input.endereco
      ? {
          rua: emptyToNull(input.endereco.rua) ?? undefined,
          numero: emptyToNull(input.endereco.numero) ?? undefined,
          bairro: emptyToNull(input.endereco.bairro) ?? undefined,
          cidade: emptyToNull(input.endereco.cidade) ?? undefined,
          cep: emptyToNull(input.endereco.cep) ?? undefined,
          complemento: emptyToNull(input.endereco.complemento) ?? undefined,
        }
      : null,
    observacoes: emptyToNull(input.observacoes),
  };
}
