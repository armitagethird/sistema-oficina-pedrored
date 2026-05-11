import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  OS,
  OSStatus,
  OsFoto,
  OsPeca,
  OsServico,
} from "./types";
import { OS_FOTOS_BUCKET } from "./constants";

export { OS_FOTOS_BUCKET };

type Cliente = { id: string; nome: string; telefone: string | null };
type Veiculo = {
  id: string;
  placa: string | null;
  modelo_custom: string | null;
  motor: string | null;
  ano: number | null;
  cor: string | null;
  km_atual: number | null;
  vw_modelo: { modelo: string; motor: string } | null;
};

export type OSListItem = OS & {
  cliente: Pick<Cliente, "id" | "nome"> | null;
  veiculo: Pick<Veiculo, "id" | "placa" | "modelo_custom" | "ano"> & {
    vw_modelo: { modelo: string; motor: string } | null;
  };
};

export type OSDetalhe = OS & {
  cliente: Cliente | null;
  veiculo: Veiculo;
  servicos: OsServico[];
  pecas: OsPeca[];
  fotos: OsFoto[];
};

export type ListOSOptions = {
  status?: OSStatus | OSStatus[];
  clienteId?: string;
  veiculoId?: string;
  search?: string;
  limit?: number;
};

const LIST_SELECT =
  "*, cliente:clientes(id, nome), veiculo:veiculos(id, placa, modelo_custom, ano, vw_modelo:vw_modelos(modelo, motor))";

export async function listOS(opts: ListOSOptions = {}): Promise<OSListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ordens_servico")
    .select(LIST_SELECT)
    .is("deletado_em", null)
    .order("criado_em", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.status) {
    if (Array.isArray(opts.status)) {
      query = query.in("status", opts.status);
    } else {
      query = query.eq("status", opts.status);
    }
  }
  if (opts.clienteId) query = query.eq("cliente_id", opts.clienteId);
  if (opts.veiculoId) query = query.eq("veiculo_id", opts.veiculoId);

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao listar OS: ${error.message}`);
  let items = (data ?? []) as OSListItem[];

  if (opts.search?.trim()) {
    const term = opts.search.trim().toLowerCase();
    items = items.filter((os) => {
      const clienteMatch = os.cliente?.nome?.toLowerCase().includes(term);
      const placaMatch = os.veiculo?.placa?.toLowerCase().includes(term);
      const numeroMatch = `#${os.numero}`.includes(term);
      return clienteMatch || placaMatch || numeroMatch;
    });
  }

  return items;
}

const DETALHE_SELECT =
  "*, cliente:clientes(id, nome, telefone), veiculo:veiculos(id, placa, modelo_custom, motor, ano, cor, km_atual, vw_modelo:vw_modelos(modelo, motor))";

export async function getOSDetalhe(id: string): Promise<OSDetalhe | null> {
  const supabase = await createClient();
  const { data: os, error: osErr } = await supabase
    .from("ordens_servico")
    .select(DETALHE_SELECT)
    .eq("id", id)
    .is("deletado_em", null)
    .maybeSingle();
  if (osErr) throw new Error(`Erro ao buscar OS: ${osErr.message}`);
  if (!os) return null;

  const [servicos, pecas, fotos] = await Promise.all([
    supabase
      .from("os_servicos")
      .select("*")
      .eq("os_id", id)
      .order("ordem", { ascending: true })
      .order("criado_em", { ascending: true }),
    supabase
      .from("os_pecas")
      .select("*")
      .eq("os_id", id)
      .order("ordem", { ascending: true })
      .order("criado_em", { ascending: true }),
    supabase
      .from("os_fotos")
      .select("*")
      .eq("os_id", id)
      .order("criado_em", { ascending: true }),
  ]);

  if (servicos.error) throw new Error(servicos.error.message);
  if (pecas.error) throw new Error(pecas.error.message);
  if (fotos.error) throw new Error(fotos.error.message);

  return {
    ...(os as OSDetalhe),
    servicos: servicos.data ?? [],
    pecas: pecas.data ?? [],
    fotos: fotos.data ?? [],
  };
}

export type DashboardContadores = Record<OSStatus, number> & { total: number };

export async function contadoresDashboard(): Promise<DashboardContadores> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .select("status")
    .is("deletado_em", null);
  if (error) throw new Error(`Erro ao contar OS: ${error.message}`);

  const base: DashboardContadores = {
    aberta: 0,
    em_andamento: 0,
    aguardando_peca: 0,
    pronta: 0,
    entregue: 0,
    cancelada: 0,
    total: 0,
  };

  for (const row of data ?? []) {
    base[row.status as OSStatus] += 1;
    base.total += 1;
  }
  return base;
}

export async function listOSRecentes(limit = 5): Promise<OSListItem[]> {
  return listOS({ limit });
}

export async function listOSByVeiculo(veiculoId: string): Promise<OSListItem[]> {
  return listOS({ veiculoId });
}
