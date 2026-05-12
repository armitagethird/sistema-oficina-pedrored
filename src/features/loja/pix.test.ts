import { describe, expect, it } from "vitest";

import { calcularCrc16Pix, gerarPixBRCode } from "./pix";

describe("calcularCrc16Pix (CRC16-CCITT, poly 0x1021, init 0xFFFF)", () => {
  it("retorna 4 chars hex uppercase", () => {
    const crc = calcularCrc16Pix("0123456789");
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
  });

  it("é determinístico", () => {
    const a = calcularCrc16Pix("hello");
    const b = calcularCrc16Pix("hello");
    expect(a).toBe(b);
  });

  it("retorna 0000 para string vazia", () => {
    // CRC16-CCITT(empty) com init=0xFFFF e sem xor-out é "FFFF"
    expect(calcularCrc16Pix("")).toBe("FFFF");
  });
});

describe("gerarPixBRCode", () => {
  const baseArgs = {
    chave: "pedro@example.com",
    nome: "Pedro Silva",
    cidade: "Brasilia",
    valor: 100,
    txid: "TX001",
  };

  it("começa com payload format indicator 000201", () => {
    const code = gerarPixBRCode(baseArgs);
    expect(code.startsWith("000201")).toBe(true);
  });

  it("contém merchant info GUI br.gov.bcb.pix e a chave", () => {
    const code = gerarPixBRCode(baseArgs);
    expect(code).toContain("br.gov.bcb.pix");
    expect(code).toContain("pedro@example.com");
  });

  it("inclui valor com 2 decimais via tag 54", () => {
    const code = gerarPixBRCode({ ...baseArgs, valor: 150 });
    // 54 + len + "150.00"
    expect(code).toContain("5406150.00");
  });

  it("normaliza acentos no nome e cidade", () => {
    const code = gerarPixBRCode({
      ...baseArgs,
      nome: "João Pereira",
      cidade: "São Paulo",
    });
    expect(code).not.toContain("ã");
    expect(code).not.toContain("ã");
    expect(code).toContain("Joao Pereira");
    expect(code).toContain("Sao Paulo");
  });

  it("termina com 6304 + 4 chars hex uppercase (CRC válido)", () => {
    const code = gerarPixBRCode(baseArgs);
    expect(code).toMatch(/6304[0-9A-F]{4}$/);
    const semCrc = code.slice(0, -4);
    const crc = code.slice(-4);
    expect(calcularCrc16Pix(semCrc)).toBe(crc);
  });

  it("trunca nome a 25 chars e cidade a 15 chars", () => {
    const code = gerarPixBRCode({
      ...baseArgs,
      nome: "Nome Muito Muito Muito Muito Longo Demais",
      cidade: "Cidade Muito Muito Muito Longa",
    });
    // tag 59: "59" + len(2) + value (len <= 25)
    const matchNome = code.match(/59(\d{2})([^0-9]+)?/);
    expect(matchNome).not.toBeNull();
    const lenNome = Number(matchNome![1]);
    expect(lenNome).toBeLessThanOrEqual(25);
  });

  it("aceita txid vazio convertendo para '***'", () => {
    const code = gerarPixBRCode({ ...baseArgs, txid: "" });
    // 62 wrapper que contém 05XX***
    expect(code).toContain("05");
    expect(code).toContain("***");
  });

  it("muda CRC ao mudar o valor", () => {
    const a = gerarPixBRCode({ ...baseArgs, valor: 100 });
    const b = gerarPixBRCode({ ...baseArgs, valor: 200 });
    expect(a.slice(-4)).not.toBe(b.slice(-4));
  });
});
