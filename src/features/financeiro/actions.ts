"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  criarParcelasSchema,
  pagamentoCreateSchema,
  pagamentoEditSchema,
  type CriarParcelasInput,
  type PagamentoCreateInput,
  type PagamentoEditInput,
} from "./schemas";
import type { Pagamento, PagamentoMetodo, PagamentoUpdate } from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateFinanceiro(osId?: string) {
  revalidatePath("/app/financeiro");
  revalidatePath("/app/financeiro/contas-a-receber");
  revalidatePath("/app/financeiro/capital-investido");
  revalidatePath("/app/financeiro/parcelas-atrasadas");
  if (osId) revalidatePath(`/app/os/${osId}`);
}

export async function createPagamento(
  input: PagamentoCreateInput,
): Promise<ActionResult<Pagamento>> {
  const parsed = pagamentoCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .insert({
      os_id: parsed.data.os_id,
      ordem: parsed.data.ordem,
      valor: parsed.data.valor,
      metodo: parsed.data.metodo as PagamentoMetodo,
      data_prevista: parsed.data.data_prevista ?? null,
      observacoes: parsed.data.observacoes ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.error("createPagamento:", error);
    return { ok: false, error: "Não foi possível criar a parcela" };
  }
  revalidateFinanceiro(parsed.data.os_id);
  return { ok: true, data };
}

export async function criarParcelasFromOS(
  input: CriarParcelasInput,
): Promise<ActionResult<Pagamento[]>> {
  const parsed = criarParcelasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();

  // Define ordem incremental a partir da maior existente da OS.
  const { data: existing, error: existErr } = await supabase
    .from("pagamentos")
    .select("ordem")
    .eq("os_id", parsed.data.os_id)
    .order("ordem", { ascending: false })
    .limit(1);
  if (existErr) {
    console.error("criarParcelasFromOS query:", existErr);
    return { ok: false, error: "Erro ao consultar parcelas existentes" };
  }
  const startOrdem = (existing?.[0]?.ordem ?? 0) + 1;

  const rows = parsed.data.parcelas.map((p, idx) => ({
    os_id: parsed.data.os_id,
    ordem: startOrdem + idx,
    valor: p.valor,
    metodo: p.metodo as PagamentoMetodo,
    data_prevista: p.data_prevista ?? null,
  }));

  const { data, error } = await supabase.from("pagamentos").insert(rows).select("*");
  if (error) {
    console.error("criarParcelasFromOS:", error);
    return { ok: false, error: "Não foi possível criar as parcelas" };
  }
  revalidateFinanceiro(parsed.data.os_id);
  return { ok: true, data: data ?? [] };
}

export async function marcarPago(id: string): Promise<ActionResult<Pagamento>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .update({ status: "pago" })
    .eq("id", id)
    .in("status", ["pendente", "atrasado"])
    .select("*")
    .single();
  if (error) {
    console.error("marcarPago:", error);
    return { ok: false, error: "Não foi possível marcar como pago" };
  }
  revalidateFinanceiro(data.os_id);
  return { ok: true, data };
}

export async function reabrirPagamento(
  id: string,
): Promise<ActionResult<Pagamento>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .update({ status: "pendente" })
    .eq("id", id)
    .in("status", ["pago", "cancelado"])
    .select("*")
    .single();
  if (error) {
    console.error("reabrirPagamento:", error);
    return { ok: false, error: "Não foi possível reabrir a parcela" };
  }
  revalidateFinanceiro(data.os_id);
  return { ok: true, data };
}

export async function cancelarPagamento(
  id: string,
): Promise<ActionResult<Pagamento>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .update({ status: "cancelado" })
    .eq("id", id)
    .not("status", "eq", "cancelado")
    .select("*")
    .single();
  if (error) {
    console.error("cancelarPagamento:", error);
    return { ok: false, error: "Não foi possível cancelar a parcela" };
  }
  revalidateFinanceiro(data.os_id);
  return { ok: true, data };
}

export async function editarPagamento(
  id: string,
  input: PagamentoEditInput,
): Promise<ActionResult<Pagamento>> {
  const parsed = pagamentoEditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const patch: PagamentoUpdate = {};
  if (parsed.data.valor !== undefined) patch.valor = parsed.data.valor;
  if (parsed.data.metodo !== undefined) patch.metodo = parsed.data.metodo as PagamentoMetodo;
  if (parsed.data.data_prevista !== undefined)
    patch.data_prevista = parsed.data.data_prevista;
  if (parsed.data.observacoes !== undefined)
    patch.observacoes = parsed.data.observacoes;

  const { data, error } = await supabase
    .from("pagamentos")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("editarPagamento:", error);
    return { ok: false, error: "Não foi possível editar a parcela" };
  }
  revalidateFinanceiro(data.os_id);
  return { ok: true, data };
}

export async function deletePagamento(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: pgto, error: getErr } = await supabase
    .from("pagamentos")
    .select("os_id, status")
    .eq("id", id)
    .maybeSingle();
  if (getErr || !pgto) {
    return { ok: false, error: "Parcela não encontrada" };
  }
  if (pgto.status === "pago") {
    return {
      ok: false,
      error: "Não é possível excluir parcela já paga. Use 'Reabrir' antes.",
    };
  }
  const { error } = await supabase.from("pagamentos").delete().eq("id", id);
  if (error) {
    console.error("deletePagamento:", error);
    return { ok: false, error: "Não foi possível excluir a parcela" };
  }
  revalidateFinanceiro(pgto.os_id);
  return { ok: true, data: undefined };
}
