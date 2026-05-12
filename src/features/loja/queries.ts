import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  ItemPedidoLoja,
  PedidoLoja,
  PedidoLojaStatus,
  Produto,
  ProdutoStatus,
} from "./types";

export type ProdutoListItem = Produto;

export type ListProdutosOptions = {
  pagina?: number;
  porPagina?: number;
  busca?: string;
  status?: ProdutoStatus;
  destaque?: boolean;
};

export async function listProdutosPublicos(
  opts: ListProdutosOptions = {},
): Promise<{
  items: ProdutoListItem[];
  total: number;
  pagina: number;
  paginas: number;
}> {
  const pagina = Math.max(1, opts.pagina ?? 1);
  const porPagina = Math.max(1, Math.min(60, opts.porPagina ?? 20));
  const supabase = await createClient();

  let q = supabase
    .from("produtos_loja")
    .select("*", { count: "exact" })
    .eq("status", "ativo")
    .order("criado_em", { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1);

  if (opts.busca?.trim()) {
    q = q.ilike("titulo", `%${opts.busca.trim()}%`);
  }
  if (opts.destaque) q = q.eq("destaque", true);

  const { data, count, error } = await q;
  if (error) throw new Error(`Erro ao listar produtos: ${error.message}`);
  const total = count ?? 0;
  return {
    items: data ?? [],
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function listProdutosDestaque(limit = 8): Promise<Produto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .eq("status", "ativo")
    .eq("destaque", true)
    .order("ordem_destaque", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Erro ao listar destaques: ${error.message}`);
  return data ?? [];
}

export async function getProdutoBySlug(slug: string): Promise<Produto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .eq("slug", slug)
    .eq("status", "ativo")
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar produto: ${error.message}`);
  return data;
}

export async function listProdutosAdmin(opts: {
  status?: ProdutoStatus;
  busca?: string;
  limit?: number;
} = {}): Promise<Produto[]> {
  const supabase = await createClient();
  let q = supabase
    .from("produtos_loja")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.busca?.trim()) q = q.ilike("titulo", `%${opts.busca.trim()}%`);
  const { data, error } = await q;
  if (error) throw new Error(`Erro ao listar produtos: ${error.message}`);
  return data ?? [];
}

export async function getProdutoAdmin(id: string): Promise<Produto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar produto: ${error.message}`);
  return data;
}

export type PedidoLojaListItem = PedidoLoja & { itens_count: number };
export type PedidoLojaDetalhe = PedidoLoja & { itens: ItemPedidoLoja[] };

export async function listPedidosAdmin(opts: {
  status?: PedidoLojaStatus | PedidoLojaStatus[];
  busca?: string;
  limit?: number;
} = {}): Promise<PedidoLojaListItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("pedidos_loja")
    .select("*, itens:itens_pedido_loja(id)")
    .order("criado_em", { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.status) {
    if (Array.isArray(opts.status)) q = q.in("status", opts.status);
    else q = q.eq("status", opts.status);
  }
  if (opts.busca?.trim()) {
    q = q.or(
      `cliente_nome.ilike.%${opts.busca.trim()}%,cliente_telefone.ilike.%${opts.busca.trim()}%`,
    );
  }
  const { data, error } = await q;
  if (error) throw new Error(`Erro ao listar pedidos: ${error.message}`);
  type Row = PedidoLoja & { itens: { id: string }[] };
  return (data ?? []).map((r) => {
    const row = r as Row;
    return { ...row, itens_count: row.itens.length };
  });
}

export async function getPedidoDetalhe(
  id: string,
): Promise<PedidoLojaDetalhe | null> {
  const supabase = await createClient();
  const { data: pedido, error } = await supabase
    .from("pedidos_loja")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar pedido: ${error.message}`);
  if (!pedido) return null;

  const { data: itens, error: itErr } = await supabase
    .from("itens_pedido_loja")
    .select("*")
    .eq("pedido_id", id)
    .order("criado_em", { ascending: true });
  if (itErr) throw new Error(`Erro ao buscar itens: ${itErr.message}`);

  return { ...pedido, itens: itens ?? [] };
}

/**
 * Acesso público ao pedido — valida que o telefone informado bate com o
 * registrado. Usa service_role para evitar dependência de policy anon direta.
 */
export async function getPedidoPublico(
  id: string,
  telefone: string,
): Promise<PedidoLojaDetalhe | null> {
  const supabase = createServiceClient();
  const tel = telefone.replace(/\D/g, "");

  const { data: pedido } = await supabase
    .from("pedidos_loja")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!pedido) return null;

  const telPedido = pedido.cliente_telefone.replace(/\D/g, "");
  if (telPedido !== tel) return null;

  const { data: itens } = await supabase
    .from("itens_pedido_loja")
    .select("*")
    .eq("pedido_id", id)
    .order("criado_em", { ascending: true });

  return { ...pedido, itens: itens ?? [] };
}

export async function contarPedidosPendentes(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("pedidos_loja")
    .select("*", { count: "exact", head: true })
    .in("status", ["aguardando_pagamento", "pagamento_em_analise"]);
  if (error)
    throw new Error(`Erro ao contar pedidos pendentes: ${error.message}`);
  return count ?? 0;
}
