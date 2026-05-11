import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Pedido, PedidoItem, PedidoStatus } from "./types";

type FornecedorMin = { id: string; nome: string };
type OsMin = {
  id: string;
  numero: number;
  cliente: { id: string; nome: string } | null;
};

export type PedidoListItem = Pedido & {
  fornecedor: FornecedorMin | null;
  os: OsMin | null;
};

export type PedidoDetalhe = Pedido & {
  fornecedor: FornecedorMin | null;
  os: OsMin | null;
  itens: PedidoItem[];
};

const LIST_SELECT =
  "*, fornecedor:fornecedores(id, nome), os:ordens_servico(id, numero, cliente:clientes(id, nome))";

export type ListPedidosOptions = {
  status?: PedidoStatus | PedidoStatus[];
  fornecedorId?: string;
  osId?: string;
  limit?: number;
};

export async function listPedidos(
  opts: ListPedidosOptions = {},
): Promise<PedidoListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("pedidos_fornecedor")
    .select(LIST_SELECT)
    .order("criado_em", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.status) {
    if (Array.isArray(opts.status)) {
      query = query.in("status", opts.status);
    } else {
      query = query.eq("status", opts.status);
    }
  }
  if (opts.fornecedorId) query = query.eq("fornecedor_id", opts.fornecedorId);
  if (opts.osId) query = query.eq("os_id", opts.osId);

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao listar pedidos: ${error.message}`);
  return (data ?? []) as PedidoListItem[];
}

export async function getPedido(id: string): Promise<PedidoDetalhe | null> {
  const supabase = await createClient();
  const { data: pedido, error } = await supabase
    .from("pedidos_fornecedor")
    .select(LIST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar pedido: ${error.message}`);
  if (!pedido) return null;

  const { data: itens, error: itensErr } = await supabase
    .from("pedido_fornecedor_itens")
    .select("*")
    .eq("pedido_id", id)
    .order("criado_em", { ascending: true });
  if (itensErr) throw new Error(`Erro ao buscar itens: ${itensErr.message}`);

  return {
    ...(pedido as PedidoListItem),
    itens: itens ?? [],
  };
}

export async function listPedidosByOs(osId: string): Promise<PedidoListItem[]> {
  return listPedidos({ osId });
}

export async function listPedidosByFornecedor(
  fornecedorId: string,
): Promise<PedidoListItem[]> {
  return listPedidos({ fornecedorId });
}

export type OsPecaPendente = {
  id: string;
  descricao: string;
  custo_unitario: number;
  quantidade: number;
  os: {
    id: string;
    numero: number;
    cliente_nome: string | null;
  } | null;
};

/**
 * Lista peças com origem=fornecedor e status pendente/comprada, de OS ativas (não entregue/cancelada),
 * para vincular a um item de pedido a fornecedor.
 */
export async function listOsPecasPendentes(): Promise<OsPecaPendente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("os_pecas")
    .select(
      "id, descricao, custo_unitario, quantidade, os:ordens_servico!inner(id, numero, status, cliente:clientes(nome))",
    )
    .eq("origem", "fornecedor")
    .in("status", ["pendente", "comprada"])
    .limit(50);

  if (error) throw new Error(`Erro ao buscar peças pendentes: ${error.message}`);

  type Row = {
    id: string;
    descricao: string;
    custo_unitario: number;
    quantidade: number;
    os: {
      id: string;
      numero: number;
      status: string;
      cliente: { nome: string } | null;
    } | null;
  };

  return (data as unknown as Row[])
    .filter((r) => r.os && r.os.status !== "entregue" && r.os.status !== "cancelada")
    .map((r) => ({
      id: r.id,
      descricao: r.descricao,
      custo_unitario: Number(r.custo_unitario),
      quantidade: Number(r.quantidade),
      os: r.os
        ? {
            id: r.os.id,
            numero: r.os.numero,
            cliente_nome: r.os.cliente?.nome ?? null,
          }
        : null,
    }));
}

export async function countPedidos(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("pedidos_fornecedor")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Erro ao contar pedidos: ${error.message}`);
  return count ?? 0;
}
