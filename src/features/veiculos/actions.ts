"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  normalizeVeiculoInput,
  veiculoCreateSchema,
  veiculoUpdateSchema,
  type VeiculoCreateInput,
  type VeiculoUpdateInput,
} from "./schemas";
import type { Veiculo, VeiculoUpdate } from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createVeiculo(
  input: VeiculoCreateInput,
): Promise<ActionResult<Veiculo>> {
  const parsed = veiculoCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const normalized = normalizeVeiculoInput(parsed.data);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .insert({
      cliente_id: parsed.data.cliente_id,
      modelo_id: normalized.modelo_id,
      modelo_custom: normalized.modelo_custom,
      motor: normalized.motor,
      ano: normalized.ano,
      placa: normalized.placa,
      cor: normalized.cor,
      km_atual: normalized.km_atual,
      observacoes: normalized.observacoes,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createVeiculo:", error);
    return { ok: false, error: "Não foi possível criar o veículo" };
  }

  revalidatePath(`/app/clientes/${parsed.data.cliente_id}`);
  revalidatePath("/app/veiculos");
  return { ok: true, data };
}

export async function updateVeiculo(
  id: string,
  input: VeiculoUpdateInput,
): Promise<ActionResult<Veiculo>> {
  const parsed = veiculoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const normalized = normalizeVeiculoInput(parsed.data);
  const supabase = await createClient();
  const patch: VeiculoUpdate = {};
  if (parsed.data.modelo_id !== undefined) patch.modelo_id = normalized.modelo_id;
  if (parsed.data.modelo_custom !== undefined)
    patch.modelo_custom = normalized.modelo_custom;
  if (parsed.data.motor !== undefined) patch.motor = normalized.motor;
  if (parsed.data.ano !== undefined) patch.ano = normalized.ano;
  if (parsed.data.placa !== undefined) patch.placa = normalized.placa;
  if (parsed.data.cor !== undefined) patch.cor = normalized.cor;
  if (parsed.data.km_atual !== undefined) patch.km_atual = normalized.km_atual;
  if (parsed.data.observacoes !== undefined)
    patch.observacoes = normalized.observacoes;

  const { data, error } = await supabase
    .from("veiculos")
    .update(patch)
    .eq("id", id)
    .is("deletado_em", null)
    .select("*")
    .single();

  if (error) {
    console.error("updateVeiculo:", error);
    return { ok: false, error: "Não foi possível atualizar o veículo" };
  }

  if (data?.cliente_id) revalidatePath(`/app/clientes/${data.cliente_id}`);
  revalidatePath(`/app/veiculos/${id}`);
  revalidatePath("/app/veiculos");
  return { ok: true, data };
}

export async function softDeleteVeiculo(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: veiculo } = await supabase
    .from("veiculos")
    .select("cliente_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("veiculos")
    .update({ deletado_em: new Date().toISOString() })
    .eq("id", id)
    .is("deletado_em", null);

  if (error) {
    console.error("softDeleteVeiculo:", error);
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Veículo tem OS ativas. Cancele ou remova antes.",
      };
    }
    return { ok: false, error: "Não foi possível remover o veículo" };
  }

  if (veiculo?.cliente_id) revalidatePath(`/app/clientes/${veiculo.cliente_id}`);
  revalidatePath("/app/veiculos");
  return { ok: true, data: undefined };
}
