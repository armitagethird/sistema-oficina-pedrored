"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

import { createClient } from "@/lib/supabase/server";
import { dispararOSPronta } from "@/features/whatsapp/disparos";
import {
  mudarStatusPecaSchema,
  mudarStatusSchema,
  osCreateSchema,
  osHeaderUpdateSchema,
  pecaSchema,
  pecaUpdateSchema,
  servicoSchema,
  servicoUpdateSchema,
  type OsCreateInput,
  type OsHeaderUpdateInput,
  type PecaInput,
  type PecaUpdateInput,
  type ServicoInput,
  type ServicoUpdateInput,
} from "./schemas";
import {
  isTransitionAllowed,
  STATUS_LABEL,
  type FotoMomento,
  type OS,
  type OSUpdate,
  type OsPeca,
  type OsPecaUpdate,
  type OsServico,
  type OSStatus,
  type PecaOrigem,
  type PecaStatus,
} from "./types";
import { OS_FOTOS_BUCKET } from "./constants";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function emptyToNull(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function revalidateOS(id?: string) {
  revalidatePath("/app");
  revalidatePath("/app/os");
  if (id) revalidatePath(`/app/os/${id}`);
}

export async function createOS(
  input: OsCreateInput,
): Promise<ActionResult<OS>> {
  const parsed = osCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .insert({
      cliente_id: parsed.data.cliente_id,
      veiculo_id: parsed.data.veiculo_id,
      descricao_problema: parsed.data.descricao_problema,
      km_entrada: parsed.data.km_entrada ?? null,
      observacoes: emptyToNull(parsed.data.observacoes),
    })
    .select("*")
    .single();

  if (error) {
    console.error("createOS:", error);
    return { ok: false, error: "Não foi possível criar a OS" };
  }

  if (parsed.data.km_entrada != null) {
    await supabase
      .from("veiculos")
      .update({ km_atual: parsed.data.km_entrada })
      .eq("id", parsed.data.veiculo_id)
      .lt("km_atual", parsed.data.km_entrada);
  }

  revalidateOS(data.id);
  return { ok: true, data };
}

export async function updateOSHeader(
  id: string,
  input: OsHeaderUpdateInput,
): Promise<ActionResult<OS>> {
  const parsed = osHeaderUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("ordens_servico")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (current?.status === "entregue" || current?.status === "cancelada") {
    return {
      ok: false,
      error: `OS ${STATUS_LABEL[current.status]} não pode ser editada.`,
    };
  }

  const patch: OSUpdate = {};
  if (parsed.data.descricao_problema !== undefined)
    patch.descricao_problema = parsed.data.descricao_problema;
  if (parsed.data.km_entrada !== undefined)
    patch.km_entrada = parsed.data.km_entrada;
  if (parsed.data.km_saida !== undefined) patch.km_saida = parsed.data.km_saida;
  if (parsed.data.observacoes !== undefined)
    patch.observacoes = emptyToNull(parsed.data.observacoes ?? null);

  const { data, error } = await supabase
    .from("ordens_servico")
    .update(patch)
    .eq("id", id)
    .is("deletado_em", null)
    .select("*")
    .single();

  if (error) {
    console.error("updateOSHeader:", error);
    return { ok: false, error: "Não foi possível atualizar a OS" };
  }

  revalidateOS(id);
  return { ok: true, data };
}

export async function mudarStatus(
  id: string,
  novoStatus: OSStatus,
  opts: { km_saida?: number } = {},
): Promise<ActionResult<OS>> {
  const parsed = mudarStatusSchema.safeParse({
    novo_status: novoStatus,
    km_saida: opts.km_saida,
  });
  if (!parsed.success) {
    return { ok: false, error: "Status inválido" };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("ordens_servico")
    .select("status, veiculo_id")
    .eq("id", id)
    .maybeSingle();

  if (!current) return { ok: false, error: "OS não encontrada" };

  if (!isTransitionAllowed(current.status, novoStatus)) {
    return {
      ok: false,
      error: `Transição inválida: ${STATUS_LABEL[current.status]} → ${STATUS_LABEL[novoStatus]}`,
    };
  }

  const patch: OSUpdate = { status: novoStatus };
  if (novoStatus === "entregue" && opts.km_saida !== undefined) {
    patch.km_saida = opts.km_saida;
  }

  const { data, error } = await supabase
    .from("ordens_servico")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("mudarStatus:", error);
    return { ok: false, error: "Não foi possível mudar o status" };
  }

  if (novoStatus === "entregue" && opts.km_saida != null) {
    await supabase
      .from("veiculos")
      .update({ km_atual: opts.km_saida })
      .eq("id", current.veiculo_id)
      .lt("km_atual", opts.km_saida);
  }

  if (novoStatus === "pronta") {
    try {
      const disparo = await dispararOSPronta(supabase, { osId: id });
      if (!disparo.ok && disparo.reason !== "skip") {
        console.warn("dispararOSPronta:", disparo);
      }
    } catch (err) {
      // Disparo é best-effort — não bloqueia mudança de status.
      console.error("dispararOSPronta erro:", err);
    }
  }

  revalidateOS(id);
  return { ok: true, data };
}

export async function addServico(
  osId: string,
  input: ServicoInput,
): Promise<ActionResult<OsServico>> {
  const parsed = servicoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("os_servicos")
    .insert({
      os_id: osId,
      descricao: parsed.data.descricao,
      valor_unitario: parsed.data.valor_unitario,
      quantidade: parsed.data.quantidade,
    })
    .select("*")
    .single();

  if (error) {
    console.error("addServico:", error);
    return { ok: false, error: "Não foi possível adicionar o serviço" };
  }

  revalidateOS(osId);
  return { ok: true, data };
}

export async function updateServico(
  id: string,
  input: ServicoUpdateInput,
): Promise<ActionResult<OsServico>> {
  const parsed = servicoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("os_servicos")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("updateServico:", error);
    return { ok: false, error: "Não foi possível atualizar o serviço" };
  }

  revalidateOS(data.os_id);
  return { ok: true, data };
}

export async function removeServico(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("os_servicos")
    .select("os_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("os_servicos").delete().eq("id", id);

  if (error) {
    console.error("removeServico:", error);
    return { ok: false, error: "Não foi possível remover o serviço" };
  }

  if (existing?.os_id) revalidateOS(existing.os_id);
  return { ok: true, data: undefined };
}

export async function addPeca(
  osId: string,
  input: PecaInput,
): Promise<ActionResult<OsPeca>> {
  const parsed = pecaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  if (
    parsed.data.origem === "estoque" &&
    !parsed.data.item_estoque_id
  ) {
    return {
      ok: false,
      error: "Selecione um item de estoque",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("os_pecas")
    .insert({
      os_id: osId,
      descricao: parsed.data.descricao,
      origem: parsed.data.origem as PecaOrigem,
      custo_unitario: parsed.data.custo_unitario,
      preco_venda_unitario: parsed.data.preco_venda_unitario,
      quantidade: parsed.data.quantidade,
      link_ml: emptyToNull(parsed.data.link_ml ?? null),
      fornecedor_nome: emptyToNull(parsed.data.fornecedor_nome ?? null),
      status: (parsed.data.status ?? "pendente") as PecaStatus,
      item_estoque_id: parsed.data.item_estoque_id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("addPeca:", error);
    return { ok: false, error: error.message ?? "Não foi possível adicionar a peça" };
  }

  revalidateOS(osId);
  return { ok: true, data };
}

export async function updatePeca(
  id: string,
  input: PecaUpdateInput,
): Promise<ActionResult<OsPeca>> {
  const parsed = pecaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const patch: OsPecaUpdate = { ...(parsed.data as OsPecaUpdate) };
  if ("link_ml" in patch)
    patch.link_ml = emptyToNull((patch.link_ml as string | null) ?? null);
  if ("fornecedor_nome" in patch)
    patch.fornecedor_nome = emptyToNull((patch.fornecedor_nome as string | null) ?? null);
  if ("item_estoque_id" in patch)
    patch.item_estoque_id = (patch.item_estoque_id as string | null) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("os_pecas")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("updatePeca:", error);
    return { ok: false, error: error.message ?? "Não foi possível atualizar a peça" };
  }

  revalidateOS(data.os_id);
  return { ok: true, data };
}

export async function removePeca(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("os_pecas")
    .select("os_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("os_pecas").delete().eq("id", id);

  if (error) {
    console.error("removePeca:", error);
    return { ok: false, error: "Não foi possível remover a peça" };
  }

  if (existing?.os_id) revalidateOS(existing.os_id);
  return { ok: true, data: undefined };
}

export async function mudarStatusPeca(
  id: string,
  novoStatus: PecaStatus,
): Promise<ActionResult<OsPeca>> {
  const parsed = mudarStatusPecaSchema.safeParse({ novo_status: novoStatus });
  if (!parsed.success) {
    return { ok: false, error: "Status inválido" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("os_pecas")
    .update({ status: novoStatus })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("mudarStatusPeca:", error);
    return { ok: false, error: "Não foi possível mudar o status da peça" };
  }

  revalidateOS(data.os_id);
  return { ok: true, data };
}

export async function uploadFoto(
  osId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; storage_path: string }>> {
  const file = formData.get("file");
  const momento = formData.get("momento") as FotoMomento | null;
  const legenda = formData.get("legenda") as string | null;

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Arquivo não enviado" };
  }
  if (!momento) return { ok: false, error: "Momento obrigatório" };

  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${osId}/${nanoid()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(OS_FOTOS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("uploadFoto storage:", uploadError);
    return { ok: false, error: "Falha no upload" };
  }

  const { data, error } = await supabase
    .from("os_fotos")
    .insert({
      os_id: osId,
      storage_path: path,
      momento,
      legenda: emptyToNull(legenda),
    })
    .select("id, storage_path")
    .single();

  if (error) {
    console.error("uploadFoto insert:", error);
    await supabase.storage.from(OS_FOTOS_BUCKET).remove([path]);
    return { ok: false, error: "Falha ao registrar foto" };
  }

  revalidateOS(osId);
  return { ok: true, data };
}

export async function removeFoto(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: foto } = await supabase
    .from("os_fotos")
    .select("storage_path, os_id")
    .eq("id", id)
    .maybeSingle();

  if (!foto) return { ok: false, error: "Foto não encontrada" };

  const { error: delDb } = await supabase.from("os_fotos").delete().eq("id", id);
  if (delDb) {
    console.error("removeFoto db:", delDb);
    return { ok: false, error: "Não foi possível remover a foto" };
  }

  await supabase.storage.from(OS_FOTOS_BUCKET).remove([foto.storage_path]);

  revalidateOS(foto.os_id);
  return { ok: true, data: undefined };
}
