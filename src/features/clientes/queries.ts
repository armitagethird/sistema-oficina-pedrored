import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "./types";

export type ListClientesOptions = {
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listClientes(
  opts: ListClientesOptions = {},
): Promise<Cliente[]> {
  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select("*")
    .is("deletado_em", null)
    .order("nome", { ascending: true });

  if (opts.search?.trim()) {
    const term = `%${opts.search.trim()}%`;
    query = query.or(`nome.ilike.${term},telefone.ilike.${term}`);
  }
  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao listar clientes: ${error.message}`);
  return data ?? [];
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .is("deletado_em", null)
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar cliente: ${error.message}`);
  return data;
}

export async function searchClientes(term: string, limit = 10): Promise<Cliente[]> {
  if (!term.trim()) return [];
  return listClientes({ search: term, limit });
}

export async function countClientes(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
    .is("deletado_em", null);
  if (error) throw new Error(`Erro ao contar clientes: ${error.message}`);
  return count ?? 0;
}
