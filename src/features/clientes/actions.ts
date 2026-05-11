"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  clienteCreateSchema,
  clienteUpdateSchema,
  normalizeClienteInput,
  type ClienteCreateInput,
  type ClienteUpdateInput,
} from "./schemas";
import type { Cliente, ClienteUpdate } from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createCliente(
  input: ClienteCreateInput,
): Promise<ActionResult<Cliente>> {
  const parsed = clienteCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const normalized = normalizeClienteInput(parsed.data);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nome: parsed.data.nome,
      telefone: normalized.telefone,
      email: normalized.email,
      cpf: normalized.cpf,
      endereco: normalized.endereco,
      observacoes: normalized.observacoes,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createCliente:", error);
    return { ok: false, error: "Não foi possível criar o cliente" };
  }

  revalidatePath("/app/clientes");
  return { ok: true, data };
}

export async function updateCliente(
  id: string,
  input: ClienteUpdateInput,
): Promise<ActionResult<Cliente>> {
  const parsed = clienteUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const normalized = normalizeClienteInput(parsed.data);
  const supabase = await createClient();
  const patch: ClienteUpdate = {};
  if (parsed.data.nome !== undefined) patch.nome = parsed.data.nome;
  if (parsed.data.telefone !== undefined) patch.telefone = normalized.telefone;
  if (parsed.data.email !== undefined) patch.email = normalized.email;
  if (parsed.data.cpf !== undefined) patch.cpf = normalized.cpf;
  if (parsed.data.endereco !== undefined) patch.endereco = normalized.endereco;
  if (parsed.data.observacoes !== undefined)
    patch.observacoes = normalized.observacoes;

  const { data, error } = await supabase
    .from("clientes")
    .update(patch)
    .eq("id", id)
    .is("deletado_em", null)
    .select("*")
    .single();

  if (error) {
    console.error("updateCliente:", error);
    return { ok: false, error: "Não foi possível atualizar o cliente" };
  }

  revalidatePath("/app/clientes");
  revalidatePath(`/app/clientes/${id}`);
  return { ok: true, data };
}

export async function softDeleteCliente(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({ deletado_em: new Date().toISOString() })
    .eq("id", id)
    .is("deletado_em", null);

  if (error) {
    console.error("softDeleteCliente:", error);
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Cliente tem veículos ou OS ativos. Remova-os antes.",
      };
    }
    return { ok: false, error: "Não foi possível remover o cliente" };
  }

  revalidatePath("/app/clientes");
  return { ok: true, data: undefined };
}
