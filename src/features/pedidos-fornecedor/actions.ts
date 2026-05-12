"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  normalizePedidoInput,
  pedidoCreateSchema,
  pedidoItemCreateSchema,
  pedidoItemUpdateSchema,
  pedidoUpdateSchema,
  type PedidoCreateInput,
  type PedidoItemCreateInput,
  type PedidoItemUpdateInput,
  type PedidoUpdateInput,
} from "./schemas";
import {
  isPedidoTransitionAllowed,
  type Pedido,
  type PedidoItem,
  type PedidoItemUpdate,
  type PedidoStatus,
  type PedidoUpdate,
} from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidatePedido(id?: string) {
  revalidatePath("/app/pedidos-fornecedor");
  revalidatePath("/app/financeiro");
  if (id) revalidatePath(`/app/pedidos-fornecedor/${id}`);
}

export async function createPedido(
  input: PedidoCreateInput,
): Promise<ActionResult<Pedido>> {
  const parsed = pedidoCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const normalized = normalizePedidoInput(parsed.data);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos_fornecedor")
    .insert({
      fornecedor_id: parsed.data.fornecedor_id,
      os_id: normalized.os_id,
      status: parsed.data.status as PedidoStatus,
      data_compra: normalized.data_compra,
      data_recebimento: normalized.data_recebimento,
      observacoes: normalized.observacoes,
    })
    .select("*")
    .single();
  if (error) {
    console.error("createPedido:", error);
    return { ok: false, error: "Não foi possível criar o pedido" };
  }
  revalidatePedido(data.id);
  return { ok: true, data };
}

export async function updatePedido(
  id: string,
  input: PedidoUpdateInput,
): Promise<ActionResult<Pedido>> {
  const parsed = pedidoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const normalized = normalizePedidoInput(parsed.data);
  const supabase = await createClient();
  const patch: PedidoUpdate = {};
  if (parsed.data.fornecedor_id !== undefined) patch.fornecedor_id = parsed.data.fornecedor_id;
  if (parsed.data.os_id !== undefined) patch.os_id = normalized.os_id;
  if (parsed.data.data_compra !== undefined) patch.data_compra = normalized.data_compra;
  if (parsed.data.data_recebimento !== undefined) patch.data_recebimento = normalized.data_recebimento;
  if (parsed.data.observacoes !== undefined) patch.observacoes = normalized.observacoes;

  const { data, error } = await supabase
    .from("pedidos_fornecedor")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("updatePedido:", error);
    return { ok: false, error: "Não foi possível atualizar o pedido" };
  }
  revalidatePedido(id);
  return { ok: true, data };
}

export async function mudarStatusPedido(
  id: string,
  newStatus: PedidoStatus,
): Promise<ActionResult<Pedido>> {
  const supabase = await createClient();
  const { data: current, error: getErr } = await supabase
    .from("pedidos_fornecedor")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (getErr || !current) {
    return { ok: false, error: "Pedido não encontrado" };
  }
  if (!isPedidoTransitionAllowed(current.status, newStatus)) {
    return {
      ok: false,
      error: `Transição ${current.status} → ${newStatus} não permitida`,
    };
  }

  const patch: PedidoUpdate = { status: newStatus };
  if (newStatus === "comprado") patch.data_compra = new Date().toISOString().slice(0, 10);
  if (newStatus === "recebido") patch.data_recebimento = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("pedidos_fornecedor")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("mudarStatusPedido:", error);
    return { ok: false, error: "Não foi possível alterar o status" };
  }
  revalidatePedido(id);
  return { ok: true, data };
}

export async function deletePedido(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("pedidos_fornecedor").delete().eq("id", id);
  if (error) {
    console.error("deletePedido:", error);
    return { ok: false, error: "Não foi possível remover o pedido" };
  }
  revalidatePedido();
  return { ok: true, data: undefined };
}

// -------- Itens --------

export async function addPedidoItem(
  pedidoId: string,
  input: PedidoItemCreateInput,
): Promise<ActionResult<PedidoItem>> {
  const parsed = pedidoItemCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedido_fornecedor_itens")
    .insert({
      pedido_id: pedidoId,
      descricao: parsed.data.descricao,
      custo_unitario: parsed.data.custo_unitario,
      quantidade: parsed.data.quantidade,
      os_peca_id: parsed.data.os_peca_id ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.error("addPedidoItem:", error);
    return { ok: false, error: "Não foi possível adicionar o item" };
  }
  revalidatePedido(pedidoId);
  return { ok: true, data };
}

export async function updatePedidoItem(
  itemId: string,
  input: PedidoItemUpdateInput,
): Promise<ActionResult<PedidoItem>> {
  const parsed = pedidoItemUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const patch: PedidoItemUpdate = {};
  if (parsed.data.descricao !== undefined) patch.descricao = parsed.data.descricao;
  if (parsed.data.custo_unitario !== undefined)
    patch.custo_unitario = parsed.data.custo_unitario;
  if (parsed.data.quantidade !== undefined) patch.quantidade = parsed.data.quantidade;
  if (parsed.data.os_peca_id !== undefined) patch.os_peca_id = parsed.data.os_peca_id ?? null;

  const { data, error } = await supabase
    .from("pedido_fornecedor_itens")
    .update(patch)
    .eq("id", itemId)
    .select("*")
    .single();
  if (error) {
    console.error("updatePedidoItem:", error);
    return { ok: false, error: "Não foi possível atualizar o item" };
  }
  revalidatePedido(data.pedido_id);
  return { ok: true, data };
}

export async function removePedidoItem(
  itemId: string,
): Promise<ActionResult<{ pedido_id: string }>> {
  const supabase = await createClient();
  const { data: item, error: getErr } = await supabase
    .from("pedido_fornecedor_itens")
    .select("pedido_id")
    .eq("id", itemId)
    .maybeSingle();
  if (getErr || !item) {
    return { ok: false, error: "Item não encontrado" };
  }
  const { error } = await supabase
    .from("pedido_fornecedor_itens")
    .delete()
    .eq("id", itemId);
  if (error) {
    console.error("removePedidoItem:", error);
    return { ok: false, error: "Não foi possível remover o item" };
  }
  revalidatePedido(item.pedido_id);
  return { ok: true, data: { pedido_id: item.pedido_id } };
}

export async function vincularOsPeca(
  itemId: string,
  osPecaId: string | null,
): Promise<ActionResult<PedidoItem>> {
  return updatePedidoItem(itemId, { os_peca_id: osPecaId });
}
