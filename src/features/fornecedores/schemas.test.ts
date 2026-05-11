import { describe, expect, it } from "vitest";

import {
  fornecedorCreateSchema,
  fornecedorUpdateSchema,
  normalizeFornecedorInput,
} from "./schemas";

describe("fornecedorCreateSchema", () => {
  it("aceita fornecedor mínimo (só nome)", () => {
    const result = fornecedorCreateSchema.safeParse({ nome: "Auto Peças X" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    const result = fornecedorCreateSchema.safeParse({ nome: "X" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome ausente", () => {
    const result = fornecedorCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("aceita email válido", () => {
    const result = fornecedorCreateSchema.safeParse({
      nome: "Distribuidora VW",
      email: "contato@distribuidora.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const result = fornecedorCreateSchema.safeParse({
      nome: "Distribuidora VW",
      email: "nao-eh-email",
    });
    expect(result.success).toBe(false);
  });

  it("aceita strings vazias em opcionais", () => {
    const result = fornecedorCreateSchema.safeParse({
      nome: "Auto Peças",
      telefone: "",
      email: "",
      cnpj: "",
      endereco: "",
    });
    expect(result.success).toBe(true);
  });

  it("trim no nome", () => {
    const result = fornecedorCreateSchema.safeParse({ nome: "  Auto Peças  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nome).toBe("Auto Peças");
  });
});

describe("normalizeFornecedorInput", () => {
  it("converte strings vazias em null", () => {
    const result = normalizeFornecedorInput({
      nome: "Fornecedor",
      telefone: "",
      email: "",
      cnpj: "",
      endereco: "",
      observacoes: "",
    });
    expect(result.telefone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.cnpj).toBeNull();
    expect(result.endereco).toBeNull();
    expect(result.observacoes).toBeNull();
  });

  it("preserva valores não vazios", () => {
    const result = normalizeFornecedorInput({
      nome: "Fornecedor",
      telefone: "11999998888",
      cnpj: "00.000.000/0001-00",
    });
    expect(result.telefone).toBe("11999998888");
    expect(result.cnpj).toBe("00.000.000/0001-00");
  });

  it("trim em valores não vazios", () => {
    const result = normalizeFornecedorInput({
      nome: "Fornecedor",
      telefone: "  123  ",
    });
    expect(result.telefone).toBe("123");
  });
});

describe("fornecedorUpdateSchema", () => {
  it("aceita objeto vazio", () => {
    const result = fornecedorUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("aceita atualização parcial", () => {
    const result = fornecedorUpdateSchema.safeParse({ telefone: "11999998888" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome inválido em update", () => {
    const result = fornecedorUpdateSchema.safeParse({ nome: "X" });
    expect(result.success).toBe(false);
  });
});
