import { formatBRL } from "@/shared/format/money";

import { PLACEHOLDERS_SET } from "./constants";
import type { TemplateVars } from "./schemas";

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export class TemplateRenderError extends Error {
  constructor(
    public placeholdersInvalidos: string[],
    public faltando: string[],
  ) {
    super(
      [
        placeholdersInvalidos.length
          ? `Placeholders inválidos: ${placeholdersInvalidos.join(", ")}`
          : null,
        faltando.length
          ? `Placeholders sem valor: ${faltando.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(". ") || "Template inválido",
    );
    this.name = "TemplateRenderError";
  }
}

interface RenderOptions {
  /**
   * Quando `true` (default), placeholders sem valor abortam o render.
   * Quando `false`, são substituídos por string vazia — útil pra preview
   * com vars parciais no editor.
   */
  strict?: boolean;
}

/**
 * Substitui `{{placeholder}}` pelo valor correspondente em `vars`.
 * Valida a lista oficial de placeholders e a presença de valores.
 */
export function renderTemplate(
  texto: string,
  vars: TemplateVars,
  options: RenderOptions = {},
): string {
  const strict = options.strict ?? true;

  const invalidos: string[] = [];
  const faltando: string[] = [];

  const out = texto.replace(PLACEHOLDER_REGEX, (_match, key: string) => {
    if (!PLACEHOLDERS_SET.has(key)) {
      invalidos.push(key);
      return "";
    }
    const valor = (vars as Record<string, string | undefined>)[key];
    if (valor === undefined || valor === null || valor === "") {
      faltando.push(key);
      return "";
    }
    return valor;
  });

  if (invalidos.length || (strict && faltando.length)) {
    throw new TemplateRenderError(
      [...new Set(invalidos)],
      [...new Set(faltando)],
    );
  }

  return out;
}

/**
 * Extrai a lista única de placeholders presentes em `texto`.
 */
export function extrairPlaceholders(texto: string): string[] {
  const matches = texto.matchAll(PLACEHOLDER_REGEX);
  const set = new Set<string>();
  for (const m of matches) set.add(m[1]);
  return [...set];
}

/**
 * Auxiliar para obter primeiro nome a partir de nome completo.
 */
export function primeiroNome(nomeCompleto: string | null | undefined): string {
  if (!nomeCompleto) return "";
  const partes = nomeCompleto.trim().split(/\s+/);
  return partes[0] ?? "";
}

const PT_BR_DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const PERIODO_LABEL: Record<string, string> = {
  manha: "manhã",
  tarde: "tarde",
};

/**
 * Helpers para montar `TemplateVars` em cada cenário.
 * Todos os valores chegam aqui já vindos do banco — formatação aplicada
 * antes de entregar ao engine.
 */
export const vars = {
  paraLembreteD1(input: {
    nome: string;
    data: string | Date;
    periodo: string;
  }): TemplateVars {
    const dataDate =
      input.data instanceof Date ? input.data : new Date(`${input.data}T12:00:00`);
    return {
      nome: input.nome,
      primeiro_nome: primeiroNome(input.nome),
      data: PT_BR_DATE.format(dataDate),
      periodo: PERIODO_LABEL[input.periodo] ?? input.periodo,
    };
  },

  paraOSPronta(input: {
    nome: string;
    valor: number | string;
    pixChave: string;
    osNumero?: number | string | null;
  }): TemplateVars {
    return {
      nome: input.nome,
      primeiro_nome: primeiroNome(input.nome),
      valor: formatBRL(input.valor),
      pix_chave: input.pixChave,
      os_numero: input.osNumero != null ? String(input.osNumero) : undefined,
    };
  },

  paraCobranca(input: {
    nome: string;
    valor: number | string;
    diasAtraso: number;
    pixChave?: string;
  }): TemplateVars {
    return {
      nome: input.nome,
      primeiro_nome: primeiroNome(input.nome),
      valor: formatBRL(input.valor),
      dias_atraso: String(input.diasAtraso),
      pix_chave: input.pixChave ?? undefined,
    };
  },

  paraLembreteOleo(input: {
    nome: string;
    kmEstimado: number;
  }): TemplateVars {
    return {
      nome: input.nome,
      primeiro_nome: primeiroNome(input.nome),
      km_estimado: input.kmEstimado.toLocaleString("pt-BR"),
    };
  },

  paraManual(texto: string): TemplateVars {
    return { texto };
  },
};
