const TZ = "America/Sao_Paulo";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(input: Date | string): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(input: Date | string): string {
  const date = toDate(input);
  return date ? DATE_FORMATTER.format(date) : "";
}

export function formatDateTime(input: Date | string): string {
  const date = toDate(input);
  return date ? DATETIME_FORMATTER.format(date) : "";
}
