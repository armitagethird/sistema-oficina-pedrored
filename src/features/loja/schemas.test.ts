import { describe, expect, it } from "vitest";

import {
  enderecoSchema,
  pedidoCreateSchema,
  produtoCreateSchema,
  produtoEditSchema,
} from "./schemas";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("produtoCreateSchema", () => {
  it("aceita produto mínimo", () => {
    expect(
      produtoCreateSchema.safeParse({
        titulo: "Filtro de óleo",
        preco: 25.5,
      }).success,
    ).toBe(true);
  });

  it("rejeita preço negativo", () => {
    expect(
      produtoCreateSchema.safeParse({
        titulo: "X",
        preco: -1,
      }).success,
    ).toBe(false);
  });

  it("rejeita título muito curto", () => {
    expect(
      produtoCreateSchema.safeParse({ titulo: "x", preco: 10 }).success,
    ).toBe(false);
  });

  it("rejeita preço promocional negativo", () => {
    expect(
      produtoCreateSchema.safeParse({
        titulo: "X",
        preco: 10,
        preco_promocional: -5,
      }).success,
    ).toBe(false);
  });
});

describe("produtoEditSchema", () => {
  it("aceita objeto vazio", () => {
    expect(produtoEditSchema.safeParse({}).success).toBe(true);
  });

  it("aceita atualização parcial", () => {
    expect(produtoEditSchema.safeParse({ destaque: true }).success).toBe(true);
  });
});

describe("enderecoSchema", () => {
  it("aceita endereço completo", () => {
    expect(
      enderecoSchema.safeParse({
        cep: "01310100",
        rua: "Av Paulista",
        numero: "1000",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
      }).success,
    ).toBe(true);
  });

  it("rejeita CEP curto", () => {
    expect(
      enderecoSchema.safeParse({
        cep: "123",
        rua: "X",
        numero: "1",
        bairro: "Y",
        cidade: "Z",
        uf: "SP",
      }).success,
    ).toBe(false);
  });

  it("rejeita UF com tamanho errado", () => {
    expect(
      enderecoSchema.safeParse({
        cep: "01310100",
        rua: "X",
        numero: "1",
        bairro: "Y",
        cidade: "Z",
        uf: "SPA",
      }).success,
    ).toBe(false);
  });
});

describe("pedidoCreateSchema", () => {
  const endereco = {
    cep: "01310100",
    rua: "X",
    numero: "1",
    bairro: "Y",
    cidade: "Z",
    uf: "SP",
  };

  it("aceita pedido mínimo", () => {
    expect(
      pedidoCreateSchema.safeParse({
        cliente_nome: "Cliente Teste",
        cliente_telefone: "11999999999",
        cliente_endereco: endereco,
        itens: [{ produto_id: UUID, quantidade: 1 }],
      }).success,
    ).toBe(true);
  });

  it("rejeita carrinho vazio", () => {
    expect(
      pedidoCreateSchema.safeParse({
        cliente_nome: "X",
        cliente_telefone: "11999999999",
        cliente_endereco: endereco,
        itens: [],
      }).success,
    ).toBe(false);
  });

  it("rejeita quantidade zero", () => {
    expect(
      pedidoCreateSchema.safeParse({
        cliente_nome: "X",
        cliente_telefone: "11999999999",
        cliente_endereco: endereco,
        itens: [{ produto_id: UUID, quantidade: 0 }],
      }).success,
    ).toBe(false);
  });

  it("rejeita email inválido", () => {
    expect(
      pedidoCreateSchema.safeParse({
        cliente_nome: "X",
        cliente_telefone: "11999999999",
        cliente_email: "not-an-email",
        cliente_endereco: endereco,
        itens: [{ produto_id: UUID, quantidade: 1 }],
      }).success,
    ).toBe(false);
  });
});
