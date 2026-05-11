import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./date";

describe("formatDate", () => {
  it("formata Date em dd/MM/yyyy no fuso São Paulo", () => {
    expect(formatDate(new Date("2026-05-11T03:00:00.000Z"))).toBe("11/05/2026");
  });

  it("aceita string ISO", () => {
    expect(formatDate("2026-01-02T03:00:00.000Z")).toBe("02/01/2026");
  });

  it("retorna string vazia para entrada inválida", () => {
    expect(formatDate("not-a-date")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("formata data + hora pt-BR no fuso São Paulo", () => {
    const result = formatDateTime("2026-05-11T15:30:00.000Z");
    expect(result).toMatch(/^11\/05\/2026,?\s+12:30$/);
  });

  it("retorna string vazia para entrada inválida", () => {
    expect(formatDateTime("garbage")).toBe("");
  });
});
