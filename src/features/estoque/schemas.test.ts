import { describe, expect, it } from "vitest";

import {
  ajusteSchema,
  categoriaSchema,
  entradaSchema,
  itemCreateSchema,
  itemEditSchema,
  saidaSchema,
} from "./schemas";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("itemCreateSchema", () => {
  it("aceita item mínimo", () => {
    const result = itemCreateSchema.safeParse({
      categoria_id: UUID,
      descricao: "Óleo 5W30 Selenia",
      unidade: "l",
      preco_venda: 70,
      alerta_minimo: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita descrição vazia", () => {
    const result = itemCreateSchema.safeParse({
      categoria_id: UUID,
      descricao: "",
      unidade: "un",
      preco_venda: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita preço negativo", () => {
    const result = itemCreateSchema.safeParse({
      categoria_id: UUID,
      descricao: "X",
      unidade: "un",
      preco_venda: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita uuid mal-formado em categoria", () => {
    const result = itemCreateSchema.safeParse({
      categoria_id: "abc",
      descricao: "X",
      unidade: "un",
      preco_venda: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita unidade inválida", () => {
    const result = itemCreateSchema.safeParse({
      categoria_id: UUID,
      descricao: "X",
      unidade: "metros-cubicos",
      preco_venda: 10,
    });
    expect(result.success).toBe(false);
  });

  it("aceita sku nulo", () => {
    const result = itemCreateSchema.safeParse({
      categoria_id: UUID,
      descricao: "X",
      unidade: "un",
      preco_venda: 10,
      sku: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("itemEditSchema", () => {
  it("aceita objeto vazio", () => {
    expect(itemEditSchema.safeParse({}).success).toBe(true);
  });

  it("aceita ativo=false", () => {
    expect(itemEditSchema.safeParse({ ativo: false }).success).toBe(true);
  });

  it("rejeita preço negativo na edição", () => {
    expect(itemEditSchema.safeParse({ preco_venda: -10 }).success).toBe(false);
  });
});

describe("entradaSchema", () => {
  it("aceita entrada válida", () => {
    expect(
      entradaSchema.safeParse({
        item_id: UUID,
        quantidade: 10,
        custo_unitario: 45,
      }).success,
    ).toBe(true);
  });

  it("rejeita quantidade zero", () => {
    expect(
      entradaSchema.safeParse({
        item_id: UUID,
        quantidade: 0,
        custo_unitario: 45,
      }).success,
    ).toBe(false);
  });

  it("rejeita custo negativo", () => {
    expect(
      entradaSchema.safeParse({
        item_id: UUID,
        quantidade: 1,
        custo_unitario: -1,
      }).success,
    ).toBe(false);
  });
});

describe("saidaSchema", () => {
  it("aceita saída válida", () => {
    expect(
      saidaSchema.safeParse({ item_id: UUID, quantidade: 1 }).success,
    ).toBe(true);
  });

  it("rejeita quantidade negativa", () => {
    expect(
      saidaSchema.safeParse({ item_id: UUID, quantidade: -1 }).success,
    ).toBe(false);
  });
});

describe("ajusteSchema", () => {
  it("aceita ajuste com motivo", () => {
    expect(
      ajusteSchema.safeParse({
        item_id: UUID,
        quantidade: 1,
        motivo: "correção inventário",
      }).success,
    ).toBe(true);
  });

  it("rejeita motivo vazio", () => {
    expect(
      ajusteSchema.safeParse({ item_id: UUID, quantidade: 1, motivo: "" })
        .success,
    ).toBe(false);
  });

  it("rejeita sem motivo", () => {
    expect(
      ajusteSchema.safeParse({ item_id: UUID, quantidade: 1 }).success,
    ).toBe(false);
  });
});

describe("categoriaSchema", () => {
  it("aceita nome válido", () => {
    expect(categoriaSchema.safeParse({ nome: "Lubrificantes" }).success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(categoriaSchema.safeParse({ nome: "" }).success).toBe(false);
  });
});
