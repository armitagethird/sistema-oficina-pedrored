import { z } from "zod";
import { AGENDA_PERIODOS, AGENDA_STATUSES } from "./constants";

export const agendamentoCreateSchema = z.object({
  cliente_id: z.string().uuid("Cliente inválido"),
  veiculo_id: z.string().uuid("Veículo inválido").nullable().optional(),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD)"),
  periodo: z.enum(AGENDA_PERIODOS as unknown as [string, ...string[]]),
  descricao: z.string().trim().min(2, "Descrição muito curta").max(500),
  observacoes: z.string().max(1000).optional().nullable(),
});

export const agendamentoUpdateSchema = agendamentoCreateSchema
  .omit({ cliente_id: true })
  .partial();

export const mudarStatusAgendamentoSchema = z.object({
  novo_status: z.enum(AGENDA_STATUSES as unknown as [string, ...string[]]),
});

export const capacidadeOverrideSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  periodo: z.enum(AGENDA_PERIODOS as unknown as [string, ...string[]]),
  capacidade: z.number().int().min(0).max(20),
  motivo: z.string().max(200).optional().nullable(),
});

export const settingsCapacidadeSchema = z.object({
  capacidade_manha: z.number().int().min(0).max(20),
  capacidade_tarde: z.number().int().min(0).max(20),
});

export type AgendamentoCreateInput = z.infer<typeof agendamentoCreateSchema>;
export type AgendamentoUpdateInput = z.infer<typeof agendamentoUpdateSchema>;
export type CapacidadeOverrideInput = z.infer<typeof capacidadeOverrideSchema>;
export type SettingsCapacidadeInput = z.infer<typeof settingsCapacidadeSchema>;
