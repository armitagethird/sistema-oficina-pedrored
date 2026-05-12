import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Fornecedor } from "./types";

export type ListFornecedoresOptions = {
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listFornecedores(
  opts: ListFornecedoresOptions = {},
): Promise<Fornecedor[]> {
  const supabase = await createClient();
  let query = supabase
    .from("fornecedores")
    .select("*")
    .is("deletado_em", null)
    .order("nome", { ascending: true });

  if (opts.search?.trim()) {
    const term = `%${opts.search.trim()}%`;
    query = query.or(`nome.ilike.${term},telefone.ilike.${term},cnpj.ilike.${term}`);
  }
  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset)
    query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao listar fornecedores: ${error.message}`);
  return data ?? [];
}

export async function getFornecedor(id: string): Promise<Fornecedor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("id", id)
    .is("deletado_em", null)
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar fornecedor: ${error.message}`);
  return data;
}

export async function countFornecedores(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("fornecedores")
    .select("*", { count: "exact", head: true })
    .is("deletado_em", null);
  if (error) throw new Error(`Erro ao contar fornecedores: ${error.message}`);
  return count ?? 0;
}
