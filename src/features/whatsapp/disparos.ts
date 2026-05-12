/**
 * Disparos de mensagens contextualizadas — usados por server actions
 * de domínios outros (ordens/financeiro/agenda) e pelos crons.
 *
 * São best-effort: erro de envio não deve abortar a operação principal.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { TEMPLATE_COBRANCA_POR_MARCO, type MarcoCobranca } from "./constants";
import { enviarMensagemCore, type EnviarResult } from "./sender";
import { renderTemplate, vars } from "./templates";
import type { WhatsappTemplateTipo } from "./types";

type SBAny = SupabaseClient<Database>;

function pixChave(): string {
  return process.env.PIX_CHAVE ?? "(chave PIX não configurada)";
}

async function carregarTemplate(
  supabase: SBAny,
  tipo: WhatsappTemplateTipo,
): Promise<{ texto: string; ativo: boolean } | null> {
  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("template_texto, ativo")
    .eq("tipo", tipo)
    .maybeSingle();
  if (error || !data) {
    console.error("carregarTemplate:", tipo, error);
    return null;
  }
  return { texto: data.template_texto, ativo: data.ativo };
}

export interface DispararOSProntaInput {
  osId: string;
}

export async function dispararOSPronta(
  supabase: SBAny,
  input: DispararOSProntaInput,
): Promise<EnviarResult | { ok: false; reason: "skip"; motivo: string }> {
  const { data: os, error } = await supabase
    .from("ordens_servico")
    .select(
      "id, numero, total_geral, cliente:clientes(id, nome, telefone)",
    )
    .eq("id", input.osId)
    .is("deletado_em", null)
    .maybeSingle();

  if (error || !os) {
    return { ok: false, reason: "skip", motivo: "OS não encontrada" };
  }
  const cliente = Array.isArray(os.cliente) ? os.cliente[0] : os.cliente;
  if (!cliente || !cliente.telefone) {
    return { ok: false, reason: "skip", motivo: "Cliente sem telefone" };
  }

  const template = await carregarTemplate(supabase, "os_pronta");
  if (!template || !template.ativo) {
    return { ok: false, reason: "skip", motivo: "Template os_pronta inativo" };
  }

  const conteudo = renderTemplate(
    template.texto,
    vars.paraOSPronta({
      nome: cliente.nome,
      valor: os.total_geral ?? 0,
      pixChave: pixChave(),
      osNumero: os.numero,
    }),
    { strict: false },
  );

  return enviarMensagemCore(supabase, {
    telefone: cliente.telefone,
    conteudo,
    templateTipo: "os_pronta",
    clienteId: cliente.id,
    osId: os.id,
  });
}

export interface DispararLembreteD1Input {
  agendamentoId: string;
}

export async function dispararLembreteD1(
  supabase: SBAny,
  input: DispararLembreteD1Input,
): Promise<EnviarResult | { ok: false; reason: "skip"; motivo: string }> {
  const { data: ag, error } = await supabase
    .from("agendamentos")
    .select(
      "id, data, periodo, descricao, cliente:clientes(id, nome, telefone)",
    )
    .eq("id", input.agendamentoId)
    .maybeSingle();

  if (error || !ag) {
    return { ok: false, reason: "skip", motivo: "Agendamento não encontrado" };
  }
  const cliente = Array.isArray(ag.cliente) ? ag.cliente[0] : ag.cliente;
  if (!cliente || !cliente.telefone) {
    return { ok: false, reason: "skip", motivo: "Cliente sem telefone" };
  }

  const template = await carregarTemplate(supabase, "lembrete_d1");
  if (!template || !template.ativo) {
    return { ok: false, reason: "skip", motivo: "Template lembrete_d1 inativo" };
  }

  const conteudo = renderTemplate(
    template.texto,
    vars.paraLembreteD1({
      nome: cliente.nome,
      data: ag.data,
      periodo: ag.periodo,
    }),
    { strict: false },
  );

  return enviarMensagemCore(supabase, {
    telefone: cliente.telefone,
    conteudo,
    templateTipo: "lembrete_d1",
    clienteId: cliente.id,
    agendamentoId: ag.id,
  });
}

export interface DispararCobrancaInput {
  pagamentoId: string;
  marco: MarcoCobranca;
  diasAtraso: number;
}

export async function dispararCobranca(
  supabase: SBAny,
  input: DispararCobrancaInput,
): Promise<EnviarResult | { ok: false; reason: "skip"; motivo: string }> {
  const { data: pag, error } = await supabase
    .from("pagamentos")
    .select(
      "id, valor, os:ordens_servico(id, cliente:clientes(id, nome, telefone))",
    )
    .eq("id", input.pagamentoId)
    .maybeSingle();

  if (error || !pag) {
    return { ok: false, reason: "skip", motivo: "Pagamento não encontrado" };
  }

  const os = Array.isArray(pag.os) ? pag.os[0] : pag.os;
  const cliente = os && (Array.isArray(os.cliente) ? os.cliente[0] : os.cliente);
  if (!cliente || !cliente.telefone) {
    return { ok: false, reason: "skip", motivo: "Cliente sem telefone" };
  }

  const tipo = TEMPLATE_COBRANCA_POR_MARCO[input.marco];
  const template = await carregarTemplate(supabase, tipo);
  if (!template || !template.ativo) {
    return { ok: false, reason: "skip", motivo: `Template ${tipo} inativo` };
  }

  const conteudo = renderTemplate(
    template.texto,
    vars.paraCobranca({
      nome: cliente.nome,
      valor: pag.valor ?? 0,
      diasAtraso: input.diasAtraso,
      pixChave: pixChave(),
    }),
    { strict: false },
  );

  return enviarMensagemCore(supabase, {
    telefone: cliente.telefone,
    conteudo,
    templateTipo: tipo,
    clienteId: cliente.id,
    osId: os?.id ?? null,
    pagamentoId: pag.id,
  });
}

export interface DispararOleoInput {
  veiculoId: string;
  kmEstimado: number;
}

export async function dispararLembreteOleo(
  supabase: SBAny,
  input: DispararOleoInput,
): Promise<EnviarResult | { ok: false; reason: "skip"; motivo: string }> {
  const { data: v, error } = await supabase
    .from("veiculos")
    .select("id, cliente:clientes(id, nome, telefone)")
    .eq("id", input.veiculoId)
    .is("deletado_em", null)
    .maybeSingle();

  if (error || !v) {
    return { ok: false, reason: "skip", motivo: "Veículo não encontrado" };
  }
  const cliente = Array.isArray(v.cliente) ? v.cliente[0] : v.cliente;
  if (!cliente || !cliente.telefone) {
    return { ok: false, reason: "skip", motivo: "Cliente sem telefone" };
  }

  const template = await carregarTemplate(supabase, "lembrete_oleo_km");
  if (!template || !template.ativo) {
    return { ok: false, reason: "skip", motivo: "Template lembrete_oleo_km inativo" };
  }

  const conteudo = renderTemplate(
    template.texto,
    vars.paraLembreteOleo({ nome: cliente.nome, kmEstimado: input.kmEstimado }),
    { strict: false },
  );

  return enviarMensagemCore(supabase, {
    telefone: cliente.telefone,
    conteudo,
    templateTipo: "lembrete_oleo_km",
    clienteId: cliente.id,
  });
}
