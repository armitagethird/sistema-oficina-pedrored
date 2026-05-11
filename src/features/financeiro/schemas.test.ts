import { describe, expect, it } from "vitest";

import {
  criarParcelasSchema,
  pagamentoCreateSchema,
  pagamentoEditSchema,
} from "./schemas";

const UUID_OS = "33333333-3333-4333-8333-333333333333";

describe("pagamentoCreateSchema", () => {
  it("aceita pagamento mínimo", () => {
    const result = pagamentoCreateSchema.safeParse({
      os_id: UUID_OS,
      ordem: 1,
      valor: 100,
      metodo: "pix",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita valor zero ou negativo", () => {
    expect(
      pagamentoCreateSchema.safeParse({ os_id: UUID_OS, valor: 0, metodo: "pix" })
        .success,
    ).toBe(false);
    expect(
      pagamentoCreateSchema.safeParse({ os_id: UUID_OS, valor: -10, metodo: "pix" })
        .success,
    ).toBe(false);
  });

  it("rejeita metodo inválido", () => {
    const result = pagamentoCreateSchema.safeParse({
      os_id: UUID_OS,
      valor: 100,
      metodo: "boleto",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita valor como string (sem coerce)", () => {
    const result = pagamentoCreateSchema.safeParse({
      os_id: UUID_OS,
      ordem: 1,
      valor: "150.75",
      metodo: "pix",
    });
    expect(result.success).toBe(false);
  });

  it("aceita ordem explícita", () => {
    const result = pagamentoCreateSchema.safeParse({
      os_id: UUID_OS,
      ordem: 3,
      valor: 100,
      metodo: "pix",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.ordem).toBe(3);
  });

  it("rejeita ordem ausente", () => {
    const result = pagamentoCreateSchema.safeParse({
      os_id: UUID_OS,
      valor: 100,
      metodo: "pix",
    });
    expect(result.success).toBe(false);
  });
});

describe("pagamentoEditSchema", () => {
  it("aceita objeto vazio", () => {
    expect(pagamentoEditSchema.safeParse({}).success).toBe(true);
  });

  it("aceita edição parcial", () => {
    expect(
      pagamentoEditSchema.safeParse({ valor: 200, observacoes: "atualizado" })
        .success,
    ).toBe(true);
  });

  it("rejeita valor zero", () => {
    expect(pagamentoEditSchema.safeParse({ valor: 0 }).success).toBe(false);
  });
});

describe("criarParcelasSchema", () => {
  it("aceita 1 parcela", () => {
    const result = criarParcelasSchema.safeParse({
      os_id: UUID_OS,
      parcelas: [{ valor: 500, metodo: "pix" }],
    });
    expect(result.success).toBe(true);
  });

  it("aceita 3 parcelas com datas", () => {
    const result = criarParcelasSchema.safeParse({
      os_id: UUID_OS,
      parcelas: [
        { valor: 200, metodo: "pix", data_prevista: "2026-06-01" },
        { valor: 300, metodo: "dinheiro", data_prevista: "2026-06-15" },
        { valor: 500, metodo: "transferencia", data_prevista: "2026-06-30" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejeita array vazio", () => {
    const result = criarParcelasSchema.safeParse({
      os_id: UUID_OS,
      parcelas: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejeita parcela com valor zero", () => {
    const result = criarParcelasSchema.safeParse({
      os_id: UUID_OS,
      parcelas: [{ valor: 0, metodo: "pix" }],
    });
    expect(result.success).toBe(false);
  });
});
