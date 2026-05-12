import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CapitalInvestidoRow,
  ContasReceberRow,
  Pagamento,
  PagamentoStatus,
} from "./types";

export async function listPagamentosByOs(osId: string): Promise<Pagamento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("os_id", osId)
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: true });
  if (error) throw new Error(`Erro ao listar pagamentos: ${error.message}`);
  return data ?? [];
}

export async function getPagamento(id: string): Promise<Pagamento | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar pagamento: ${error.message}`);
  return data;
}

export async function listContasAReceber(): Promise<ContasReceberRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("view_contas_a_receber")
    .select("*")
    .order("proxima_data", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Erro ao listar contas a receber: ${error.message}`);
  return data ?? [];
}

export async function listCapitalInvestido(): Promise<CapitalInvestidoRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("view_capital_investido")
    .select("*")
    .order("data_compra", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`Erro ao listar capital investido: ${error.message}`);
  return data ?? [];
}

export type ResumoFinanceiro = {
  total_a_receber: number;
  total_atrasado: number;
  capital_investido: number;
  parcelas_atrasadas: number;
};

export async function getResumoFinanceiro(): Promise<ResumoFinanceiro> {
  const [contasReceber, capital] = await Promise.all([
    listContasAReceber(),
    listCapitalInvestido(),
  ]);

  const total_a_receber = contasReceber.reduce(
    (acc, r) => acc + Number(r.total_em_aberto ?? 0),
    0,
  );
  const total_atrasado = contasReceber.reduce(
    (acc, r) => acc + Number(r.total_atrasado ?? 0),
    0,
  );
  const parcelas_atrasadas = contasReceber.reduce(
    (acc, r) => acc + Number(r.parcelas_atrasadas ?? 0),
    0,
  );

  // Capital investido = soma de (os_total - cliente_pagou) para cada linha,
  // tratando linha sem OS como pedido "puro estoque" (valor_total integral).
  const capital_investido = capital.reduce((acc, row) => {
    if (row.os_id) {
      const restante =
        Number(row.os_total ?? 0) - Number(row.cliente_pagou ?? 0);
      return acc + Math.max(0, restante);
    }
    return acc + Number(row.valor_total ?? 0);
  }, 0);

  return {
    total_a_receber,
    total_atrasado,
    capital_investido,
    parcelas_atrasadas,
  };
}

export type ParcelasProximas30Dias = {
  data: string; // YYYY-MM-DD
  pendente: number;
  atrasado: number;
};

/**
 * Soma valores de pagamentos não pagos agrupados pela data prevista,
 * pros próximos 30 dias a partir de hoje (inclui atrasos anteriores ao topo do dia 0).
 */
export async function listPagamentos30Dias(): Promise<ParcelasProximas30Dias[]> {
  const supabase = await createClient();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + 30);

  const { data, error } = await supabase
    .from("pagamentos")
    .select("valor, status, data_prevista")
    .in("status", ["pendente", "atrasado"])
    .not("data_prevista", "is", null)
    .lte("data_prevista", fim.toISOString().slice(0, 10));
  if (error) throw new Error(`Erro ao agrupar pagamentos: ${error.message}`);

  type Row = { valor: number; status: PagamentoStatus; data_prevista: string };
  const buckets = new Map<string, { pendente: number; atrasado: number }>();
  for (const row of (data ?? []) as Row[]) {
    const cur = buckets.get(row.data_prevista) ?? { pendente: 0, atrasado: 0 };
    if (row.status === "atrasado") cur.atrasado += Number(row.valor);
    else cur.pendente += Number(row.valor);
    buckets.set(row.data_prevista, cur);
  }

  const sorted = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, v]) => ({ data, pendente: v.pendente, atrasado: v.atrasado }));
  return sorted;
}

export async function listParcelasAtrasadas(): Promise<
  Array<
    Pagamento & {
      os: {
        id: string;
        numero: number;
        cliente: { id: string; nome: string; telefone: string | null } | null;
      } | null;
    }
  >
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .select(
      "*, os:ordens_servico(id, numero, cliente:clientes(id, nome, telefone))",
    )
    .eq("status", "atrasado")
    .order("data_prevista", { ascending: true });
  if (error) throw new Error(`Erro ao listar atrasados: ${error.message}`);
  type Row = Pagamento & {
    os: {
      id: string;
      numero: number;
      cliente: { id: string; nome: string; telefone: string | null } | null;
    } | null;
  };
  return (data ?? []) as Row[];
}

export async function getProgressoPagamentoOS(osId: string): Promise<{
  total_pago: number;
  total_pendente: number;
  total_atrasado: number;
  total_geral: number;
}> {
  const supabase = await createClient();
  const [pagamentosRes, osRes] = await Promise.all([
    supabase.from("pagamentos").select("valor, status").eq("os_id", osId),
    supabase
      .from("ordens_servico")
      .select("total_geral")
      .eq("id", osId)
      .maybeSingle(),
  ]);
  if (pagamentosRes.error)
    throw new Error(`Erro ao buscar pagamentos: ${pagamentosRes.error.message}`);
  if (osRes.error) throw new Error(`Erro ao buscar OS: ${osRes.error.message}`);

  let total_pago = 0;
  let total_pendente = 0;
  let total_atrasado = 0;
  for (const p of pagamentosRes.data ?? []) {
    const v = Number(p.valor);
    if (p.status === "pago") total_pago += v;
    if (p.status === "pendente") total_pendente += v;
    if (p.status === "atrasado") total_atrasado += v;
  }
  return {
    total_pago,
    total_pendente,
    total_atrasado,
    total_geral: Number(osRes.data?.total_geral ?? 0),
  };
}
