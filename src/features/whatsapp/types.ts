/**
 * Types do domínio WhatsApp.
 *
 * Espelham o schema definido em
 * `supabase/migrations/20260715000000_init_whatsapp.sql`.
 * Após `pnpm db:gen` rodar com a migration aplicada, podemos
 * substituir por `Tables<"whatsapp_msgs">` etc, mas a interface
 * pública dos consumidores não muda.
 */

export type WhatsappDirecao = "in" | "out";

export type WhatsappMsgStatus =
  | "pendente"
  | "enviada"
  | "entregue"
  | "lida"
  | "falhou";

export type WhatsappTemplateTipo =
  | "lembrete_d1"
  | "os_pronta"
  | "cobranca_atraso_3"
  | "cobranca_atraso_7"
  | "cobranca_atraso_15"
  | "lembrete_oleo_km"
  | "manual";

export type WhatsappJobTipo =
  | "lembrete_d1"
  | "cobranca_atraso"
  | "lembrete_oleo_km";

export interface WhatsappTemplate {
  tipo: WhatsappTemplateTipo;
  template_texto: string;
  ativo: boolean;
  descricao: string | null;
  atualizado_em: string;
}

export interface WhatsappMsg {
  id: string;
  cliente_id: string | null;
  telefone: string;
  direcao: WhatsappDirecao;
  template_tipo: WhatsappTemplateTipo | null;
  conteudo: string;
  status: WhatsappMsgStatus;
  evolution_msg_id: string | null;
  os_id: string | null;
  agendamento_id: string | null;
  pagamento_id: string | null;
  payload_raw: unknown;
  erro: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface WhatsappJobCron {
  id: string;
  tipo: WhatsappJobTipo;
  alvo_id: string;
  marco: string;
  msg_id: string | null;
  sucesso: boolean;
  erro: string | null;
  criado_em: string;
}

export const DIRECAO_LABEL: Record<WhatsappDirecao, string> = {
  in: "Recebida",
  out: "Enviada",
};

export const STATUS_LABEL: Record<WhatsappMsgStatus, string> = {
  pendente: "Pendente",
  enviada: "Enviada",
  entregue: "Entregue",
  lida: "Lida",
  falhou: "Falhou",
};

export const TEMPLATE_LABEL: Record<WhatsappTemplateTipo, string> = {
  lembrete_d1: "Lembrete D-1",
  os_pronta: "OS pronta",
  cobranca_atraso_3: "Cobrança 3 dias",
  cobranca_atraso_7: "Cobrança 7 dias",
  cobranca_atraso_15: "Cobrança 15 dias",
  lembrete_oleo_km: "Lembrete óleo (km)",
  manual: "Manual",
};

export const JOB_LABEL: Record<WhatsappJobTipo, string> = {
  lembrete_d1: "Lembrete D-1",
  cobranca_atraso: "Cobrança atraso",
  lembrete_oleo_km: "Lembrete óleo",
};
