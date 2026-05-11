import { describe, expect, it } from "vitest";

import {
  getNextStatuses,
  isTransitionAllowed,
  type OSStatus,
} from "./types";

describe("isTransitionAllowed", () => {
  it("aberta → em_andamento permitido", () => {
    expect(isTransitionAllowed("aberta", "em_andamento")).toBe(true);
  });

  it("aberta → cancelada permitido", () => {
    expect(isTransitionAllowed("aberta", "cancelada")).toBe(true);
  });

  it("aberta → pronta proibido (não pode pular fluxo)", () => {
    expect(isTransitionAllowed("aberta", "pronta")).toBe(false);
  });

  it("em_andamento → aguardando_peca permitido", () => {
    expect(isTransitionAllowed("em_andamento", "aguardando_peca")).toBe(true);
  });

  it("aguardando_peca → em_andamento permitido", () => {
    expect(isTransitionAllowed("aguardando_peca", "em_andamento")).toBe(true);
  });

  it("aguardando_peca → pronta proibido (volta para andamento antes)", () => {
    expect(isTransitionAllowed("aguardando_peca", "pronta")).toBe(false);
  });

  it("pronta → entregue permitido", () => {
    expect(isTransitionAllowed("pronta", "entregue")).toBe(true);
  });

  it("pronta → em_andamento permitido (correção)", () => {
    expect(isTransitionAllowed("pronta", "em_andamento")).toBe(true);
  });

  it("entregue é terminal — nenhuma transição permitida", () => {
    const allStatuses: OSStatus[] = [
      "aberta",
      "em_andamento",
      "aguardando_peca",
      "pronta",
      "entregue",
      "cancelada",
    ];
    for (const to of allStatuses) {
      expect(isTransitionAllowed("entregue", to)).toBe(false);
    }
  });

  it("cancelada é terminal — nenhuma transição permitida", () => {
    const allStatuses: OSStatus[] = [
      "aberta",
      "em_andamento",
      "aguardando_peca",
      "pronta",
      "entregue",
      "cancelada",
    ];
    for (const to of allStatuses) {
      expect(isTransitionAllowed("cancelada", to)).toBe(false);
    }
  });
});

describe("getNextStatuses", () => {
  it("retorna próximos válidos de aberta", () => {
    expect(getNextStatuses("aberta")).toEqual(["em_andamento", "cancelada"]);
  });

  it("retorna vazio para entregue (terminal)", () => {
    expect(getNextStatuses("entregue")).toEqual([]);
  });

  it("retorna vazio para cancelada (terminal)", () => {
    expect(getNextStatuses("cancelada")).toEqual([]);
  });
});
