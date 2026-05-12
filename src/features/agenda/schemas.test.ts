import { describe, expect, it } from "vitest";
import {
  agendamentoCreateSchema,
  agendamentoUpdateSchema,
  mudarStatusAgendamentoSchema,
  capacidadeOverrideSchema,
  settingsCapacidadeSchema,
} from "./schemas";

const UUID_CLIENTE = "550e8400-e29b-41d4-a716-446655440001";
const UUID_VEICULO = "550e8400-e29b-41d4-a716-446655440002";

describe("agendamentoCreateSchema", () => {
  it("valida entrada correta", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: UUID_CLIENTE,
      veiculo_id: UUID_VEICULO,
      data: "2026-07-15",
      periodo: "manha",
      descricao: "Troca de óleo",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita cliente_id inválido", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: "nao-uuid-invalido",
      data: "2026-07-15",
      periodo: "manha",
      descricao: "Troca",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/Cliente inválido/);
  });

  it("rejeita data em formato inválido", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: UUID_CLIENTE,
      data: "15/07/2026",
      periodo: "tarde",
      descricao: "Revisão",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita período inválido", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: UUID_CLIENTE,
      data: "2026-07-15",
      periodo: "noite",
      descricao: "Revisão",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita descricao vazia", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: UUID_CLIENTE,
      data: "2026-07-15",
      periodo: "manha",
      descricao: "",
    });
    expect(result.success).toBe(false);
  });

  it("aceita veiculo_id nulo", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: UUID_CLIENTE,
      veiculo_id: null,
      data: "2026-07-15",
      periodo: "tarde",
      descricao: "Diagnóstico",
    });
    expect(result.success).toBe(true);
  });
});

describe("mudarStatusAgendamentoSchema", () => {
  it("valida status válido", () => {
    const result = mudarStatusAgendamentoSchema.safeParse({
      novo_status: "confirmado",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita status inválido", () => {
    const result = mudarStatusAgendamentoSchema.safeParse({
      novo_status: "suspenso",
    });
    expect(result.success).toBe(false);
  });
});

describe("settingsCapacidadeSchema", () => {
  it("valida capacidades entre 0 e 20", () => {
    const result = settingsCapacidadeSchema.safeParse({
      capacidade_manha: 3,
      capacidade_tarde: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita capacidade negativa", () => {
    const result = settingsCapacidadeSchema.safeParse({
      capacidade_manha: -1,
      capacidade_tarde: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita capacidade acima de 20", () => {
    const result = settingsCapacidadeSchema.safeParse({
      capacidade_manha: 21,
      capacidade_tarde: 3,
    });
    expect(result.success).toBe(false);
  });
});
