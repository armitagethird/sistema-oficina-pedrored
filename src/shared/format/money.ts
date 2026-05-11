const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function normalize(formatted: string): string {
  return formatted.replace(/[  ]/g, " ");
}

export function formatBRL(value: number | string): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return normalize(BRL_FORMATTER.format(0));
  return normalize(BRL_FORMATTER.format(numeric));
}

export function parseBRL(input: string): number {
  if (!input) return 0;
  const cleaned = input
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}
