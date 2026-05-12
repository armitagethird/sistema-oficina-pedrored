import { describe, expect, it } from "vitest";

import { linkCreateSchema, marcarComissaoSchema } from "./schemas";
import { isLinkTransitionAllowed } from "./types";

const UUID = "44444444-4444-4444-8444-444444444444";

describe("linkCreateSchema", () => {
  it("aceita link válido", () => {
    const result = linkCreateSchema.safeParse({
      cliente_id: UUID,
      link: "https://produto.mercadolivre.com.br/MLB-12345-filtro-de-oleo",
      descricao_peca: "Filtro de óleo",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita link sem protocolo", () => {
    const result = linkCreateSchema.safeParse({
      cliente_id: UUID,
      link: "produto.mercadolivre.com.br/algo",
      descricao_peca: "Filtro",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição vazia", () => {
    const result = linkCreateSchema.safeParse({
      cliente_id: UUID,
      link: "https://example.com",
      descricao_peca: "",
    });
    expect(result.success).toBe(false);
  });

  it("aceita preco e comissao opcionais", () => {
    const result = linkCreateSchema.safeParse({
      cliente_id: UUID,
      link: "https://example.com",
      descricao_peca: "Filtro",
      preco_estimado: 50,
      comissao_estimada: 5,
    });
    expect(result.success).toBe(true);
  });
});

describe("marcarComissaoSchema", () => {
  it("aceita comissão >= 0", () => {
    expect(marcarComissaoSchema.safeParse({ comissao_recebida: 0 }).success).toBe(
      true,
    );
    expect(
      marcarComissaoSchema.safeParse({ comissao_recebida: 12.5 }).success,
    ).toBe(true);
  });

  it("rejeita comissão negativa", () => {
    expect(
      marcarComissaoSchema.safeParse({ comissao_recebida: -1 }).success,
    ).toBe(false);
  });
});

describe("isLinkTransitionAllowed", () => {
  it("enviado → cliente_comprou", () => {
    expect(isLinkTransitionAllowed("enviado", "cliente_comprou")).toBe(true);
  });

  it("enviado → comissao_recebida NÃO (pula etapa)", () => {
    expect(isLinkTransitionAllowed("enviado", "comissao_recebida")).toBe(false);
  });

  it("cliente_comprou → comissao_recebida", () => {
    expect(isLinkTransitionAllowed("cliente_comprou", "comissao_recebida")).toBe(
      true,
    );
  });

  it("comissao_recebida é final", () => {
    expect(isLinkTransitionAllowed("comissao_recebida", "enviado")).toBe(false);
    expect(isLinkTransitionAllowed("comissao_recebida", "cancelado")).toBe(false);
  });

  it("cancelado é final", () => {
    expect(isLinkTransitionAllowed("cancelado", "enviado")).toBe(false);
  });
});
