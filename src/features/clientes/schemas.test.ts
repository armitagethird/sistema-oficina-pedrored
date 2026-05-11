import { describe, expect, it } from "vitest";

import {
  clienteCreateSchema,
  clienteUpdateSchema,
  normalizeClienteInput,
} from "./schemas";

describe("clienteCreateSchema", () => {
  it("aceita cliente mínimo (só nome)", () => {
    const result = clienteCreateSchema.safeParse({ nome: "João da Silva" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    const result = clienteCreateSchema.safeParse({ nome: "J" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome ausente", () => {
    const result = clienteCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("aceita email válido", () => {
    const result = clienteCreateSchema.safeParse({
      nome: "Maria",
      email: "maria@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const result = clienteCreateSchema.safeParse({
      nome: "Maria",
      email: "nao-eh-email",
    });
    expect(result.success).toBe(false);
  });

  it("aceita strings vazias em opcionais", () => {
    const result = clienteCreateSchema.safeParse({
      nome: "Pedro",
      telefone: "",
      email: "",
      cpf: "",
    });
    expect(result.success).toBe(true);
  });

  it("aceita endereço parcial", () => {
    const result = clienteCreateSchema.safeParse({
      nome: "Ana",
      endereco: { cidade: "São Paulo" },
    });
    expect(result.success).toBe(true);
  });

  it("trim no nome", () => {
    const result = clienteCreateSchema.safeParse({ nome: "  José  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nome).toBe("José");
  });
});

describe("normalizeClienteInput", () => {
  it("converte strings vazias em null", () => {
    const result = normalizeClienteInput({
      nome: "Pedro",
      telefone: "",
      email: "",
      cpf: "",
    });
    expect(result.telefone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.cpf).toBeNull();
  });

  it("preserva valores não vazios", () => {
    const result = normalizeClienteInput({
      nome: "Pedro",
      telefone: "11999998888",
      email: "p@x.com",
    });
    expect(result.telefone).toBe("11999998888");
    expect(result.email).toBe("p@x.com");
  });

  it("trim em valores não vazios", () => {
    const result = normalizeClienteInput({
      nome: "Pedro",
      telefone: "  123  ",
    });
    expect(result.telefone).toBe("123");
  });

  it("retorna endereco null quando undefined", () => {
    const result = normalizeClienteInput({ nome: "Pedro" });
    expect(result.endereco).toBeNull();
  });
});

describe("clienteUpdateSchema", () => {
  it("aceita objeto vazio", () => {
    const result = clienteUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("aceita atualização parcial", () => {
    const result = clienteUpdateSchema.safeParse({ telefone: "11999998888" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome inválido em update", () => {
    const result = clienteUpdateSchema.safeParse({ nome: "X" });
    expect(result.success).toBe(false);
  });
});
