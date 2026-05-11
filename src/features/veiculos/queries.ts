import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Veiculo, VeiculoComModelo, VwModelo } from "./types";

export async function listVwModelos(): Promise<VwModelo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vw_modelos")
    .select("*")
    .order("modelo", { ascending: true })
    .order("motor", { ascending: true });
  if (error) throw new Error(`Erro ao listar modelos VW: ${error.message}`);
  return data ?? [];
}

export async function searchVwModelos(term: string, limit = 20): Promise<VwModelo[]> {
  const supabase = await createClient();
  let query = supabase
    .from("vw_modelos")
    .select("*")
    .order("modelo", { ascending: true })
    .order("motor", { ascending: true })
    .limit(limit);

  const trimmed = term.trim();
  if (trimmed) {
    const wildcard = `%${trimmed}%`;
    query = query.or(`modelo.ilike.${wildcard},motor.ilike.${wildcard}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao buscar modelos VW: ${error.message}`);
  return data ?? [];
}

export async function listVeiculosByCliente(
  clienteId: string,
): Promise<VeiculoComModelo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select("*, vw_modelo:vw_modelos(modelo, motor, combustivel)")
    .eq("cliente_id", clienteId)
    .is("deletado_em", null)
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Erro ao listar veículos: ${error.message}`);
  return (data ?? []) as VeiculoComModelo[];
}

export async function getVeiculo(id: string): Promise<VeiculoComModelo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select("*, vw_modelo:vw_modelos(modelo, motor, combustivel)")
    .eq("id", id)
    .is("deletado_em", null)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar veículo: ${error.message}`);
  return (data ?? null) as VeiculoComModelo | null;
}

export async function listVeiculos(opts: {
  search?: string;
  limit?: number;
} = {}): Promise<VeiculoComModelo[]> {
  const supabase = await createClient();
  let query = supabase
    .from("veiculos")
    .select("*, vw_modelo:vw_modelos(modelo, motor, combustivel)")
    .is("deletado_em", null)
    .order("criado_em", { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.search?.trim()) {
    const term = `%${opts.search.trim()}%`;
    query = query.or(`placa.ilike.${term},modelo_custom.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao listar veículos: ${error.message}`);
  return (data ?? []) as VeiculoComModelo[];
}

export type VeiculoKmRegistro = {
  os_id: string;
  os_numero: number;
  km: number;
  data: string;
};

export async function listKmTimelineVeiculo(
  veiculoId: string,
): Promise<VeiculoKmRegistro[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .select("id, numero, km_entrada, km_saida, criado_em, fechado_em")
    .eq("veiculo_id", veiculoId)
    .is("deletado_em", null)
    .order("criado_em", { ascending: true });
  if (error) throw new Error(`Erro ao listar histórico de km: ${error.message}`);

  const registros: VeiculoKmRegistro[] = [];
  for (const os of data ?? []) {
    if (typeof os.km_entrada === "number") {
      registros.push({
        os_id: os.id,
        os_numero: os.numero,
        km: os.km_entrada,
        data: os.criado_em,
      });
    }
    if (typeof os.km_saida === "number" && os.fechado_em) {
      registros.push({
        os_id: os.id,
        os_numero: os.numero,
        km: os.km_saida,
        data: os.fechado_em,
      });
    }
  }
  return registros;
}

export type Cliente = { id: string; nome: string };

export async function getClienteFromVeiculo(veiculoId: string): Promise<Veiculo & {
  cliente: Cliente | null;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select("*, cliente:clientes(id, nome)")
    .eq("id", veiculoId)
    .is("deletado_em", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as (Veiculo & { cliente: Cliente | null }) | null;
}
