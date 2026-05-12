import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Categoria, Item, Movimentacao, MovimentacaoTipo } from "./types";

export type ItemListItem = Item & {
  categoria: Pick<Categoria, "id" | "nome"> | null;
};

export type ListItensOptions = {
  categoria_id?: string;
  abaixo_minimo?: boolean;
  ativo?: boolean;
  busca?: string;
  limit?: number;
};

const LIST_SELECT = "*, categoria:categorias_estoque(id, nome)";

export async function listItens(
  opts: ListItensOptions = {},
): Promise<ItemListItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("itens_estoque")
    .select(LIST_SELECT)
    .is("deletado_em", null)
    .order("descricao", { ascending: true })
    .limit(opts.limit ?? 200);

  if (opts.categoria_id) q = q.eq("categoria_id", opts.categoria_id);
  if (opts.ativo !== undefined) q = q.eq("ativo", opts.ativo);

  const { data, error } = await q;
  if (error) throw new Error(`Erro ao listar itens: ${error.message}`);
  let items = (data ?? []) as ItemListItem[];

  if (opts.abaixo_minimo) {
    items = items.filter(
      (i) => Number(i.quantidade_atual) <= Number(i.alerta_minimo),
    );
  }
  if (opts.busca?.trim()) {
    const t = opts.busca.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.descricao.toLowerCase().includes(t) ||
        (i.sku ?? "").toLowerCase().includes(t),
    );
  }
  return items;
}

export async function getItem(id: string): Promise<ItemListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_estoque")
    .select(LIST_SELECT)
    .eq("id", id)
    .is("deletado_em", null)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar item: ${error.message}`);
  return data as ItemListItem | null;
}

export type MovimentacaoListItem = Movimentacao & {
  item: Pick<Item, "id" | "descricao" | "unidade"> | null;
};

export async function listMovimentacoes(opts: {
  item_id?: string;
  tipo?: MovimentacaoTipo;
  limit?: number;
} = {}): Promise<MovimentacaoListItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("movimentacoes_estoque")
    .select("*, item:itens_estoque(id, descricao, unidade)")
    .order("criado_em", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.item_id) q = q.eq("item_id", opts.item_id);
  if (opts.tipo) q = q.eq("tipo", opts.tipo);

  const { data, error } = await q;
  if (error) throw new Error(`Erro ao listar movimentações: ${error.message}`);
  return (data ?? []) as MovimentacaoListItem[];
}

export async function listCategorias(): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_estoque")
    .select("*")
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });
  if (error) throw new Error(`Erro ao listar categorias: ${error.message}`);
  return data ?? [];
}

export async function contarItensAbaixoMinimo(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("view_itens_abaixo_minimo")
    .select("id");
  if (error)
    throw new Error(`Erro ao contar itens abaixo do mínimo: ${error.message}`);
  return data?.length ?? 0;
}
