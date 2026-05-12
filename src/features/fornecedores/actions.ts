"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  fornecedorCreateSchema,
  fornecedorUpdateSchema,
  normalizeFornecedorInput,
  type FornecedorCreateInput,
  type FornecedorUpdateInput,
} from "./schemas";
import type { Fornecedor, FornecedorUpdate } from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createFornecedor(
  input: FornecedorCreateInput,
): Promise<ActionResult<Fornecedor>> {
  const parsed = fornecedorCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const normalized = normalizeFornecedorInput(parsed.data);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .insert({
      nome: parsed.data.nome,
      telefone: normalized.telefone,
      email: normalized.email,
      cnpj: normalized.cnpj,
      endereco: normalized.endereco,
      observacoes: normalized.observacoes,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createFornecedor:", error);
    return { ok: false, error: "Não foi possível criar o fornecedor" };
  }

  revalidatePath("/app/fornecedores");
  return { ok: true, data };
}

export async function updateFornecedor(
  id: string,
  input: FornecedorUpdateInput,
): Promise<ActionResult<Fornecedor>> {
  const parsed = fornecedorUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const normalized = normalizeFornecedorInput(parsed.data);
  const supabase = await createClient();
  const patch: FornecedorUpdate = {};
  if (parsed.data.nome !== undefined) patch.nome = parsed.data.nome;
  if (parsed.data.telefone !== undefined) patch.telefone = normalized.telefone;
  if (parsed.data.email !== undefined) patch.email = normalized.email;
  if (parsed.data.cnpj !== undefined) patch.cnpj = normalized.cnpj;
  if (parsed.data.endereco !== undefined) patch.endereco = normalized.endereco;
  if (parsed.data.observacoes !== undefined)
    patch.observacoes = normalized.observacoes;

  const { data, error } = await supabase
    .from("fornecedores")
    .update(patch)
    .eq("id", id)
    .is("deletado_em", null)
    .select("*")
    .single();

  if (error) {
    console.error("updateFornecedor:", error);
    return { ok: false, error: "Não foi possível atualizar o fornecedor" };
  }

  revalidatePath("/app/fornecedores");
  revalidatePath(`/app/fornecedores/${id}`);
  return { ok: true, data };
}

export async function softDeleteFornecedor(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedores")
    .update({ deletado_em: new Date().toISOString() })
    .eq("id", id)
    .is("deletado_em", null);

  if (error) {
    console.error("softDeleteFornecedor:", error);
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Fornecedor tem pedidos vinculados. Cancele os pedidos antes.",
      };
    }
    return { ok: false, error: "Não foi possível remover o fornecedor" };
  }

  revalidatePath("/app/fornecedores");
  return { ok: true, data: undefined };
}
