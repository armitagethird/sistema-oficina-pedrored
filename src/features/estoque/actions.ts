"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  ajusteSchema,
  categoriaSchema,
  entradaSchema,
  itemCreateSchema,
  itemEditSchema,
  saidaSchema,
  type AjusteInput,
  type CategoriaInput,
  type EntradaInput,
  type ItemCreateInput,
  type ItemEditInput,
  type SaidaInput,
} from "./schemas";
import type { Categoria, Item, ItemUpdate, MovimentacaoTipo } from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateEstoque(id?: string) {
  revalidatePath("/app");
  revalidatePath("/app/estoque");
  if (id) revalidatePath(`/app/estoque/${id}`);
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

// -------- Itens --------

export async function createItem(
  input: ItemCreateInput,
): Promise<ActionResult<Item>> {
  const parsed = itemCreateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_estoque")
    .insert({
      categoria_id: parsed.data.categoria_id,
      descricao: parsed.data.descricao,
      sku: emptyToNull(parsed.data.sku ?? null),
      unidade: parsed.data.unidade,
      preco_venda: parsed.data.preco_venda,
      alerta_minimo: parsed.data.alerta_minimo,
      observacoes: emptyToNull(parsed.data.observacoes ?? null),
    })
    .select("*")
    .single();
  if (error) {
    console.error("createItem:", error);
    return { ok: false, error: "Não foi possível criar o item" };
  }
  revalidateEstoque();
  return { ok: true, data };
}

export async function updateItem(
  id: string,
  input: ItemEditInput,
): Promise<ActionResult<Item>> {
  const parsed = itemEditSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const patch: ItemUpdate = { ...parsed.data };
  if ("sku" in parsed.data)
    patch.sku = emptyToNull((parsed.data.sku as string | null) ?? null);
  if ("observacoes" in parsed.data)
    patch.observacoes = emptyToNull(
      (parsed.data.observacoes as string | null) ?? null,
    );

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_estoque")
    .update(patch)
    .eq("id", id)
    .is("deletado_em", null)
    .select("*")
    .single();
  if (error) {
    console.error("updateItem:", error);
    return { ok: false, error: "Não foi possível atualizar o item" };
  }
  revalidateEstoque(id);
  return { ok: true, data };
}

export async function softDeleteItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("itens_estoque")
    .update({ deletado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("softDeleteItem:", error);
    return { ok: false, error: "Não foi possível remover o item" };
  }
  revalidateEstoque();
  return { ok: true, data: undefined };
}

// -------- Movimentações --------

async function aplicarMovimentacao(args: {
  item_id: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  custo_unitario?: number | null;
  os_id?: string | null;
  os_peca_id?: string | null;
  pedido_loja_id?: string | null;
  pedido_fornecedor_id?: string | null;
  ajuste_motivo?: string | null;
}): Promise<ActionResult<{ movimentacao_id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("aplicar_movimentacao_estoque", {
    p_item_id: args.item_id,
    p_tipo: args.tipo,
    p_quantidade: args.quantidade,
    p_custo_unitario: args.custo_unitario ?? undefined,
    p_os_id: args.os_id ?? undefined,
    p_os_peca_id: args.os_peca_id ?? undefined,
    p_pedido_loja_id: args.pedido_loja_id ?? undefined,
    p_pedido_fornecedor_id: args.pedido_fornecedor_id ?? undefined,
    p_ajuste_motivo: args.ajuste_motivo ?? undefined,
  });
  if (error) {
    console.error("aplicarMovimentacao:", error);
    return { ok: false, error: error.message };
  }
  revalidateEstoque(args.item_id);
  return { ok: true, data: { movimentacao_id: data as string } };
}

export async function registrarEntrada(
  input: EntradaInput,
): Promise<ActionResult<{ movimentacao_id: string }>> {
  const parsed = entradaSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  return aplicarMovimentacao({
    item_id: parsed.data.item_id,
    tipo: "entrada",
    quantidade: parsed.data.quantidade,
    custo_unitario: parsed.data.custo_unitario,
    pedido_fornecedor_id: parsed.data.pedido_fornecedor_id ?? null,
  });
}

export async function registrarSaida(
  input: SaidaInput,
): Promise<ActionResult<{ movimentacao_id: string }>> {
  const parsed = saidaSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  // Saída avulsa: registramos como saida_loja com motivo descritivo,
  // já que saida_os requer os_id (vinculação direta com ordem).
  return aplicarMovimentacao({
    item_id: parsed.data.item_id,
    tipo: "saida_loja",
    quantidade: parsed.data.quantidade,
    ajuste_motivo: parsed.data.motivo ?? "saída avulsa",
  });
}

export async function registrarAjuste(
  input: AjusteInput,
): Promise<ActionResult<{ movimentacao_id: string }>> {
  const parsed = ajusteSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  return aplicarMovimentacao({
    item_id: parsed.data.item_id,
    tipo: "ajuste",
    quantidade: parsed.data.quantidade,
    ajuste_motivo: parsed.data.motivo,
  });
}

// -------- Categorias --------

export async function createCategoria(
  input: CategoriaInput,
): Promise<ActionResult<Categoria>> {
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_estoque")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) {
    console.error("createCategoria:", error);
    return { ok: false, error: "Não foi possível criar a categoria" };
  }
  revalidateEstoque();
  return { ok: true, data };
}

export async function updateCategoria(
  id: string,
  input: CategoriaInput,
): Promise<ActionResult<Categoria>> {
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_estoque")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("updateCategoria:", error);
    return { ok: false, error: "Não foi possível atualizar a categoria" };
  }
  revalidateEstoque();
  return { ok: true, data };
}

export async function deleteCategoria(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias_estoque")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("deleteCategoria:", error);
    return {
      ok: false,
      error: "Categoria tem itens vinculados ou não pode ser removida",
    };
  }
  revalidateEstoque();
  return { ok: true, data: undefined };
}
