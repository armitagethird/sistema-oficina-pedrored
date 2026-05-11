"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  linkCreateSchema,
  linkUpdateSchema,
  marcarComissaoSchema,
  type LinkCreateInput,
  type LinkUpdateInput,
  type MarcarComissaoInput,
} from "./schemas";
import {
  isLinkTransitionAllowed,
  type LinkAfiliado,
  type LinkAfiliadoStatus,
  type LinkAfiliadoUpdate,
} from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateLinks(clienteId?: string, osId?: string | null) {
  revalidatePath("/app/financeiro");
  if (clienteId) revalidatePath(`/app/clientes/${clienteId}`);
  if (osId) revalidatePath(`/app/os/${osId}`);
}

export async function registrarLinkEnviado(
  input: LinkCreateInput,
): Promise<ActionResult<LinkAfiliado>> {
  const parsed = linkCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links_afiliado_enviados")
    .insert({
      cliente_id: parsed.data.cliente_id,
      os_id: parsed.data.os_id ?? null,
      link: parsed.data.link,
      descricao_peca: parsed.data.descricao_peca,
      preco_estimado: parsed.data.preco_estimado ?? null,
      comissao_estimada: parsed.data.comissao_estimada ?? null,
      observacoes: parsed.data.observacoes ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.error("registrarLinkEnviado:", error);
    return { ok: false, error: "Não foi possível registrar o link" };
  }
  revalidateLinks(data.cliente_id, data.os_id);
  return { ok: true, data };
}

export async function editarLink(
  id: string,
  input: LinkUpdateInput,
): Promise<ActionResult<LinkAfiliado>> {
  const parsed = linkUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const patch: LinkAfiliadoUpdate = {};
  if (parsed.data.cliente_id !== undefined) patch.cliente_id = parsed.data.cliente_id;
  if (parsed.data.os_id !== undefined) patch.os_id = parsed.data.os_id;
  if (parsed.data.link !== undefined) patch.link = parsed.data.link;
  if (parsed.data.descricao_peca !== undefined)
    patch.descricao_peca = parsed.data.descricao_peca;
  if (parsed.data.preco_estimado !== undefined)
    patch.preco_estimado = parsed.data.preco_estimado;
  if (parsed.data.comissao_estimada !== undefined)
    patch.comissao_estimada = parsed.data.comissao_estimada;
  if (parsed.data.observacoes !== undefined)
    patch.observacoes = parsed.data.observacoes;

  const { data, error } = await supabase
    .from("links_afiliado_enviados")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("editarLink:", error);
    return { ok: false, error: "Não foi possível editar o link" };
  }
  revalidateLinks(data.cliente_id, data.os_id);
  return { ok: true, data };
}

async function mudarStatusLink(
  id: string,
  newStatus: LinkAfiliadoStatus,
  extraPatch: LinkAfiliadoUpdate = {},
): Promise<ActionResult<LinkAfiliado>> {
  const supabase = await createClient();
  const { data: current, error: getErr } = await supabase
    .from("links_afiliado_enviados")
    .select("status, cliente_id, os_id")
    .eq("id", id)
    .maybeSingle();
  if (getErr || !current) {
    return { ok: false, error: "Link não encontrado" };
  }
  if (!isLinkTransitionAllowed(current.status, newStatus)) {
    return {
      ok: false,
      error: `Transição ${current.status} → ${newStatus} não permitida`,
    };
  }

  const patch: LinkAfiliadoUpdate = { status: newStatus, ...extraPatch };

  const { data, error } = await supabase
    .from("links_afiliado_enviados")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("mudarStatusLink:", error);
    return { ok: false, error: "Não foi possível alterar o status" };
  }
  revalidateLinks(data.cliente_id, data.os_id);
  return { ok: true, data };
}

export async function marcarClienteComprou(
  id: string,
): Promise<ActionResult<LinkAfiliado>> {
  return mudarStatusLink(id, "cliente_comprou", {
    data_compra: new Date().toISOString(),
  });
}

export async function marcarComissaoRecebida(
  id: string,
  input: MarcarComissaoInput,
): Promise<ActionResult<LinkAfiliado>> {
  const parsed = marcarComissaoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  return mudarStatusLink(id, "comissao_recebida", {
    comissao_recebida: parsed.data.comissao_recebida,
    data_comissao: new Date().toISOString(),
  });
}

export async function cancelarLink(
  id: string,
): Promise<ActionResult<LinkAfiliado>> {
  return mudarStatusLink(id, "cancelado");
}

export async function deleteLink(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: current, error: getErr } = await supabase
    .from("links_afiliado_enviados")
    .select("cliente_id, os_id, status")
    .eq("id", id)
    .maybeSingle();
  if (getErr || !current) {
    return { ok: false, error: "Link não encontrado" };
  }
  if (current.status === "comissao_recebida") {
    return {
      ok: false,
      error: "Não é possível excluir link com comissão registrada",
    };
  }
  const { error } = await supabase
    .from("links_afiliado_enviados")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("deleteLink:", error);
    return { ok: false, error: "Não foi possível excluir o link" };
  }
  revalidateLinks(current.cliente_id, current.os_id);
  return { ok: true, data: undefined };
}
