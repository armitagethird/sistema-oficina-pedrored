import { describe, expect, it } from "vitest";

import {
  normalizeVeiculoInput,
  veiculoCreateSchema,
} from "./schemas";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("veiculoCreateSchema", () => {
  it("aceita modelo VW (modelo_id) sem custom", () => {
    const result = veiculoCreateSchema.safeParse({
      cliente_id: UUID,
      modelo_id: UUID,
    });
    expect(result.success).toBe(true);
  });

  it("aceita modelo_custom sem modelo_id", () => {
    const result = veiculoCreateSchema.safeParse({
      cliente_id: UUID,
      modelo_custom: "Voyage",
      motor: "1.6",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita sem modelo (nem id nem custom)", () => {
    const result = veiculoCreateSchema.safeParse({
      cliente_id: UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita modelo_custom só com espaços", () => {
    const result = veiculoCreateSchema.safeParse({
      cliente_id: UUID,
      modelo_custom: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita cliente_id inválido", () => {
    const result = veiculoCreateSchema.safeParse({
      cliente_id: "nao-eh-uuid",
      modelo_id: UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita ano antes de 1950", () => {
    const result = veiculoCreateSchema.safeParse({
      cliente_id: UUID,
      modelo_id: UUID,
      ano: 1900,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita km negativa", () => {
    const result = veiculoCreateSchema.safeParse({
      cliente_id: UUID,
      modelo_id: UUID,
      km_atual: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("normalizeVeiculoInput", () => {
  it("uppercase em placa", () => {
    const result = normalizeVeiculoInput({
      cliente_id: UUID,
      modelo_id: UUID,
      placa: "abc1d23",
    });
    expect(result.placa).toBe("ABC1D23");
  });

  it("default km_atual para 0", () => {
    const result = normalizeVeiculoInput({
      cliente_id: UUID,
      modelo_id: UUID,
    });
    expect(result.km_atual).toBe(0);
  });

  it("converte string vazia em null", () => {
    const result = normalizeVeiculoInput({
      cliente_id: UUID,
      modelo_id: UUID,
      cor: "",
      observacoes: "",
    });
    expect(result.cor).toBeNull();
    expect(result.observacoes).toBeNull();
  });
});
