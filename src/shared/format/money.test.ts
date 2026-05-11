import { describe, expect, it } from "vitest";
import { formatBRL, parseBRL } from "./money";

describe("formatBRL", () => {
  it("formata número positivo com duas casas", () => {
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50");
  });

  it("formata string numérica", () => {
    expect(formatBRL("99.9")).toBe("R$ 99,90");
  });

  it("formata zero", () => {
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("formata negativo", () => {
    expect(formatBRL(-50)).toBe("-R$ 50,00");
  });

  it("formata milhares grandes", () => {
    expect(formatBRL(1234567.89)).toBe("R$ 1.234.567,89");
  });

  it("retorna R$ 0,00 para entrada inválida", () => {
    expect(formatBRL("xyz")).toBe("R$ 0,00");
  });
});

describe("parseBRL", () => {
  it("converte string formatada em número", () => {
    expect(parseBRL("R$ 1.234,50")).toBe(1234.5);
  });

  it("aceita só dígitos com vírgula", () => {
    expect(parseBRL("99,90")).toBe(99.9);
  });

  it("aceita string vazia como 0", () => {
    expect(parseBRL("")).toBe(0);
  });

  it("ignora caracteres não-numéricos", () => {
    expect(parseBRL("R$1.000,00 (à vista)")).toBe(1000);
  });
});
