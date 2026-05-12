"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

import { createClient } from "@/lib/supabase/server";
import {
  produtoCreateSchema,
  produtoEditSchema,
  pedidoLojaStatusSchema,
  type ProdutoCreateInput,
  type ProdutoEditInput,
} from "./schemas";
import {
  isPedidoLojaTransitionAllowed,
  PEDIDO_LOJA_STATUS_LABEL,
  type PedidoLoja,
  type PedidoLojaStatus,
  type PedidoLojaUpdate,
  type Produto,
  type ProdutoStatus,
  type ProdutoUpdate,
} from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateLoja(pedidoId?: string, produtoSlug?: string) {
  revalidatePath("/app/loja");
  revalidatePath("/app/loja/produtos");
  revalidatePath("/app/loja/pedidos");
  revalidatePath("/");
  revalidatePath("/produtos");
  if (pedidoId) {
    revalidatePath(`/app/loja/pedidos/${pedidoId}`);
    revalidatePath(`/pedido/${pedidoId}`);
  }
  if (produtoSlug) revalidatePath(`/produto/${produtoSlug}`);
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

// -------- Produtos --------

export async function createProduto(
  input: ProdutoCreateInput,
): Promise<ActionResult<Produto>> {
  const parsed = produtoCreateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = await createClient();
  const { data: slug, error: slugErr } = await supabase.rpc("gerar_slug_unico", {
    p_titulo: parsed.data.titulo,
  });
  if (slugErr || !slug) {
    console.error("createProduto slug:", slugErr);
    return { ok: false, error: "Não foi possível gerar o slug do produto" };
  }

  const { data, error } = await supabase
    .from("produtos_loja")
    .insert({
      titulo: parsed.data.titulo,
      slug: slug as string,
      descricao: emptyToNull(parsed.data.descricao ?? null),
      preco: parsed.data.preco,
      preco_promocional: parsed.data.preco_promocional ?? null,
      estoque_manual: parsed.data.estoque_manual ?? null,
      frete_info: emptyToNull(parsed.data.frete_info ?? null),
      status: (parsed.data.status ?? "ativo") as ProdutoStatus,
      destaque: parsed.data.destaque ?? false,
      ordem_destaque: parsed.data.ordem_destaque ?? 0,
      item_estoque_id: parsed.data.item_estoque_id ?? null,
      fotos: parsed.data.fotos ?? [],
    })
    .select("*")
    .single();
  if (error) {
    console.error("createProduto:", error);
    return { ok: false, error: "Não foi possível criar o produto" };
  }
  revalidateLoja(undefined, data.slug);
  return { ok: true, data };
}

export async function updateProduto(
  id: string,
  input: ProdutoEditInput,
): Promise<ActionResult<Produto>> {
  const parsed = produtoEditSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = await createClient();
  const patch: ProdutoUpdate = { ...(parsed.data as ProdutoUpdate) };
  if ("descricao" in patch)
    patch.descricao = emptyToNull((patch.descricao as string | null) ?? null);
  if ("frete_info" in patch)
    patch.frete_info = emptyToNull((patch.frete_info as string | null) ?? null);

  // Se mudou título, regenerar slug
  if (parsed.data.titulo) {
    const { data: novoSlug } = await supabase.rpc("gerar_slug_unico", {
      p_titulo: parsed.data.titulo,
      p_id: id,
    });
    if (novoSlug) patch.slug = novoSlug as string;
  }

  const { data, error } = await supabase
    .from("produtos_loja")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("updateProduto:", error);
    return { ok: false, error: "Não foi possível atualizar o produto" };
  }
  revalidateLoja(undefined, data.slug);
  return { ok: true, data };
}

export async function softDeleteProduto(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("produtos_loja")
    .update({ status: "inativo" })
    .eq("id", id);
  if (error) {
    console.error("softDeleteProduto:", error);
    return { ok: false, error: "Não foi possível inativar o produto" };
  }
  revalidateLoja();
  return { ok: true, data: undefined };
}

const PRODUTO_FOTOS_BUCKET = "loja-produtos";

export async function uploadProdutoFoto(
  produtoId: string,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Arquivo não enviado" };
  if (file.size > 5 * 1024 * 1024)
    return { ok: false, error: "Arquivo maior que 5MB" };

  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${produtoId}/${nanoid()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(PRODUTO_FOTOS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (upErr) {
    console.error("uploadProdutoFoto:", upErr);
    return { ok: false, error: "Falha no upload" };
  }

  // Bucket é público — guardamos só o path; a URL pública pode ser construída via getPublicUrl
  const { data: pub } = supabase.storage.from(PRODUTO_FOTOS_BUCKET).getPublicUrl(path);
  const publicUrl = pub?.publicUrl ?? path;

  // Acrescenta no jsonb fotos
  const { data: prod } = await supabase
    .from("produtos_loja")
    .select("fotos, slug")
    .eq("id", produtoId)
    .maybeSingle();
  const fotos = Array.isArray(prod?.fotos) ? (prod!.fotos as string[]) : [];
  fotos.push(publicUrl);
  const { error: updErr } = await supabase
    .from("produtos_loja")
    .update({ fotos })
    .eq("id", produtoId);
  if (updErr) {
    await supabase.storage.from(PRODUTO_FOTOS_BUCKET).remove([path]);
    return { ok: false, error: "Falha ao registrar foto" };
  }
  revalidateLoja(undefined, prod?.slug);
  return { ok: true, data: { url: publicUrl } };
}

export async function removerProdutoFoto(
  produtoId: string,
  fotoUrl: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: prod } = await supabase
    .from("produtos_loja")
    .select("fotos, slug")
    .eq("id", produtoId)
    .maybeSingle();
  if (!prod) return { ok: false, error: "Produto não encontrado" };
  const fotos = (Array.isArray(prod.fotos) ? (prod.fotos as string[]) : []).filter(
    (u) => u !== fotoUrl,
  );
  const { error } = await supabase
    .from("produtos_loja")
    .update({ fotos })
    .eq("id", produtoId);
  if (error) return { ok: false, error: "Falha ao remover foto" };

  // Tenta apagar do storage (path = parte após bucket-name no URL pública)
  const marker = `/${PRODUTO_FOTOS_BUCKET}/`;
  const idx = fotoUrl.indexOf(marker);
  if (idx >= 0) {
    const path = fotoUrl.slice(idx + marker.length);
    await supabase.storage.from(PRODUTO_FOTOS_BUCKET).remove([path]);
  }
  revalidateLoja(undefined, prod.slug);
  return { ok: true, data: undefined };
}

// -------- Pedidos (admin) --------

/**
 * Confirma pagamento do pedido e, se solicitado, baixa quantidades dos itens
 * vinculados a item_estoque via RPC aplicar_movimentacao_estoque(saida_loja).
 *
 * Retorna { entradas } com a contagem de itens baixados.
 */
export async function confirmarPagamento(
  pedidoId: string,
  baixarEstoque: boolean = true,
): Promise<ActionResult<{ baixas: number }>> {
  const supabase = await createClient();
  const { data: pedido } = await supabase
    .from("pedidos_loja")
    .select("id, status")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return { ok: false, error: "Pedido não encontrado" };
  if (pedido.status === "pago" || pedido.status === "em_separacao") {
    return { ok: false, error: "Pedido já foi confirmado" };
  }
  if (!isPedidoLojaTransitionAllowed(pedido.status, "pago")) {
    return {
      ok: false,
      error: `Status ${PEDIDO_LOJA_STATUS_LABEL[pedido.status]} não permite confirmação`,
    };
  }

  let baixas = 0;
  if (baixarEstoque) {
    const { data: itens } = await supabase
      .from("itens_pedido_loja")
      .select("quantidade, produto:produtos_loja(item_estoque_id)")
      .eq("pedido_id", pedidoId);
    type Row = {
      quantidade: number;
      produto: { item_estoque_id: string | null } | null;
    };
    for (const r of (itens ?? []) as unknown as Row[]) {
      if (!r.produto?.item_estoque_id) continue;
      const { error: rpcErr } = await supabase.rpc("aplicar_movimentacao_estoque", {
        p_item_id: r.produto.item_estoque_id,
        p_tipo: "saida_loja",
        p_quantidade: Number(r.quantidade),
        p_pedido_loja_id: pedidoId,
      });
      if (rpcErr) {
        console.error("confirmarPagamento RPC:", rpcErr);
        return { ok: false, error: rpcErr.message };
      }
      baixas += 1;
    }
  }

  const { error: updErr } = await supabase
    .from("pedidos_loja")
    .update({ status: "pago", pago_em: new Date().toISOString() })
    .eq("id", pedidoId);
  if (updErr) {
    console.error("confirmarPagamento update:", updErr);
    return { ok: false, error: "Falha ao atualizar pedido" };
  }

  // TODO(sprint-5): notificar cliente via WhatsApp que pagamento foi confirmado.

  revalidateLoja(pedidoId);
  revalidatePath("/app/estoque");
  return { ok: true, data: { baixas } };
}

export async function atualizarStatusPedido(
  pedidoId: string,
  novoStatus: PedidoLojaStatus,
): Promise<ActionResult<PedidoLoja>> {
  const parsed = pedidoLojaStatusSchema.safeParse({ novo_status: novoStatus });
  if (!parsed.success) return { ok: false, error: "Status inválido" };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("pedidos_loja")
    .select("status")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!current) return { ok: false, error: "Pedido não encontrado" };
  if (!isPedidoLojaTransitionAllowed(current.status, novoStatus)) {
    return {
      ok: false,
      error: `Transição ${PEDIDO_LOJA_STATUS_LABEL[current.status]} → ${PEDIDO_LOJA_STATUS_LABEL[novoStatus]} não permitida`,
    };
  }
  const patch: PedidoLojaUpdate = { status: novoStatus };
  if (novoStatus === "enviado") patch.enviado_em = new Date().toISOString();

  const { data, error } = await supabase
    .from("pedidos_loja")
    .update(patch)
    .eq("id", pedidoId)
    .select("*")
    .single();
  if (error) return { ok: false, error: "Falha ao atualizar status" };

  revalidateLoja(pedidoId);
  return { ok: true, data };
}

export async function cancelarPedido(
  pedidoId: string,
  motivo: string,
): Promise<ActionResult<PedidoLoja>> {
  if (!motivo?.trim()) return { ok: false, error: "Motivo obrigatório" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos_loja")
    .update({ status: "cancelado", observacoes_internas: motivo })
    .eq("id", pedidoId)
    .select("*")
    .single();
  if (error) return { ok: false, error: "Falha ao cancelar pedido" };
  revalidateLoja(pedidoId);
  return { ok: true, data };
}
