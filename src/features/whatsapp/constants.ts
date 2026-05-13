import type { WhatsappTemplateTipo } from "./types";

/**
 * Placeholders aceitos pelos templates. A renderização valida que cada
 * `{{placeholder}}` no texto pertence a esta lista (caso contrário aborta
 * com erro detalhado).
 *
 * `texto` é placeholder universal usado pelo template `manual` para
 * permitir mensagem livre.
 */
export const PLACEHOLDERS_VALIDOS = [
  "nome",
  "primeiro_nome",
  "data",
  "periodo",
  "valor",
  "pix_chave",
  "os_numero",
  "km_estimado",
  "dias_atraso",
  "texto",
] as const;

export type PlaceholderValido = (typeof PLACEHOLDERS_VALIDOS)[number];

export const PLACEHOLDERS_SET = new Set<string>(PLACEHOLDERS_VALIDOS);

/**
 * Subconjunto de placeholders esperados/obrigatórios por template.
 * Usado pelo editor para exibir hint ao Pedro e na validação de
 * variáveis antes do envio.
 */
export const PLACEHOLDERS_POR_TEMPLATE: Record<
  WhatsappTemplateTipo,
  readonly PlaceholderValido[]
> = {
  lembrete_d1: ["primeiro_nome", "data", "periodo"],
  os_pronta: ["primeiro_nome", "valor", "pix_chave"],
  cobranca_atraso_3: ["primeiro_nome", "valor", "dias_atraso"],
  cobranca_atraso_7: ["primeiro_nome", "valor", "dias_atraso", "pix_chave"],
  cobranca_atraso_15: ["nome", "valor", "dias_atraso"],
  lembrete_oleo_km: ["primeiro_nome", "km_estimado"],
  manual: ["texto"],
};

/**
 * Settings keys usados pela feature.
 */
export const SETTINGS_KEYS = {
  enviosAtivos: "whatsapp_envios_ativos",
  oleoKmIntervalo: "whatsapp_oleo_km_intervalo",
  oleoKmAntecedencia: "whatsapp_oleo_km_antecedencia",
  oleoKmDia: "whatsapp_oleo_km_dia",
} as const;

/**
 * Marcos de atraso (em dias) que disparam cobrança. Usado pelo cron
 * `cobranca-atraso` + idempotência via `whatsapp_jobs_cron.marco`.
 */
export const MARCOS_COBRANCA = [3, 7, 15] as const;
export type MarcoCobranca = (typeof MARCOS_COBRANCA)[number];

export const TEMPLATE_COBRANCA_POR_MARCO: Record<
  MarcoCobranca,
  "cobranca_atraso_3" | "cobranca_atraso_7" | "cobranca_atraso_15"
> = {
  3: "cobranca_atraso_3",
  7: "cobranca_atraso_7",
  15: "cobranca_atraso_15",
};
