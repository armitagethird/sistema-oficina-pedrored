import { describe, expect, it } from "vitest";

import {
  pedidoCreateSchema,
  pedidoItemCreateSchema,
  pedidoUpdateSchema,
} from "./schemas";
import { isPedidoTransitionAllowed } from "./types";

const UUID = "11111111-1111-4111-8111-111111111111";
const UUID_OS = "22222222-2222-4222-8222-222222222222";

describe("pedidoCreateSchema", () => {
  it("aceita pedido mínimo (fornecedor + status)", () => {
    const result = pedidoCreateSchema.safeParse({
      fornecedor_id: UUID,
      status: "cotacao",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("cotacao");
  });

  it("rejeita pedido sem status", () => {
    const result = pedidoCreateSchema.safeParse({ fornecedor_id: UUID });
    expect(result.success).toBe(false);
  });

  it("rejeita fornecedor_id inválido", () => {
    const result = pedidoCreateSchema.safeParse({
      fornecedor_id: "abc",
      status: "cotacao",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita status inválido", () => {
    const result = pedidoCreateSchema.safeParse({
      fornecedor_id: UUID,
      status: "qualquer",
    });
    expect(result.success).toBe(false);
  });

  it("aceita os_id opcional", () => {
    const result = pedidoCreateSchema.safeParse({
      fornecedor_id: UUID,
      status: "cotacao",
      os_id: UUID_OS,
    });
    expect(result.success).toBe(true);
  });
});

describe("pedidoItemCreateSchema", () => {
  it("aceita item válido", () => {
    const result = pedidoItemCreateSchema.safeParse({
      descricao: "Filtro de óleo",
      custo_unitario: 25.5,
      quantidade: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita descrição vazia", () => {
    const result = pedidoItemCreateSchema.safeParse({
      descricao: "",
      custo_unitario: 10,
      quantidade: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita quantidade zero", () => {
    const result = pedidoItemCreateSchema.safeParse({
      descricao: "X",
      custo_unitario: 10,
      quantidade: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita custo negativo", () => {
    const result = pedidoItemCreateSchema.safeParse({
      descricao: "X",
      custo_unitario: -1,
      quantidade: 1,
    });
    expect(result.success).toBe(false);
  });

  it("coerce string em número", () => {
    const result = pedidoItemCreateSchema.safeParse({
      descricao: "X",
      custo_unitario: "12.50",
      quantidade: "3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.custo_unitario).toBe(12.5);
      expect(result.data.quantidade).toBe(3);
    }
  });
});

describe("pedidoUpdateSchema", () => {
  it("aceita objeto vazio", () => {
    const result = pedidoUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("aceita atualização parcial de status", () => {
    const result = pedidoUpdateSchema.safeParse({ status: "recebido" });
    expect(result.success).toBe(true);
  });
});

describe("isPedidoTransitionAllowed", () => {
  it("cotacao → comprado é permitido", () => {
    expect(isPedidoTransitionAllowed("cotacao", "comprado")).toBe(true);
  });

  it("cotacao → recebido NÃO é permitido (pula etapa)", () => {
    expect(isPedidoTransitionAllowed("cotacao", "recebido")).toBe(false);
  });

  it("comprado → recebido é permitido", () => {
    expect(isPedidoTransitionAllowed("comprado", "recebido")).toBe(true);
  });

  it("recebido é estado final (não sai)", () => {
    expect(isPedidoTransitionAllowed("recebido", "cotacao")).toBe(false);
    expect(isPedidoTransitionAllowed("recebido", "cancelado")).toBe(false);
  });

  it("cancelado é estado final", () => {
    expect(isPedidoTransitionAllowed("cancelado", "cotacao")).toBe(false);
  });

  it("qualquer status ativo pode ir pra cancelado", () => {
    expect(isPedidoTransitionAllowed("cotacao", "cancelado")).toBe(true);
    expect(isPedidoTransitionAllowed("comprado", "cancelado")).toBe(true);
  });
});
