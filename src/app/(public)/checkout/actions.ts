"use server";

import { revalidatePath } from "next/cache";

import { createServiceClient } from "@/lib/supabase/service";
import { pedidoCreateSchema, type PedidoCreateInput } from "@/features/loja/schemas";
import { gerarPixBRCode } from "@/features/loja/pix";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type CriarPedidoResult = {
  pedidoId: string;
  numero: number;
  valorTotal: number;
  pix: { qrText: string; chave: string; valor: number };
};

export async function criarPedido(
  input: PedidoCreateInput,
): Promise<Result<CriarPedidoResult>> {
  const parsed = pedidoCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const supabase = createServiceClient();
  const produtoIds = parsed.data.itens.map((i) => i.produto_id);
  const { data: produtos, error: pErr } = await supabase
    .from("produtos_loja")
    .select(
      "id, titulo, preco, preco_promocional, status, item_estoque_id, estoque_manual, somente_sob_encomenda",
    )
    .in("id", produtoIds);
  if (pErr || !produtos || produtos.length !== produtoIds.length) {
    return { ok: false, error: "Algum produto não está mais disponível" };
  }

  for (const p of produtos) {
    if (p.status !== "ativo") {
      return { ok: false, error: `Produto "${p.titulo}" indisponível` };
    }
  }

  // Valida saldo de estoque para produtos vinculados que NÃO sejam sob encomenda.
  const itensComVinculo = produtos.filter(
    (p) => !p.somente_sob_encomenda && p.item_estoque_id,
  );
  if (itensComVinculo.length > 0) {
    const { data: saldos, error: sErr } = await supabase
      .from("itens_estoque")
      .select("id, quantidade_atual")
      .in(
        "id",
        itensComVinculo.map((p) => p.item_estoque_id!),
      );
    if (sErr) {
      console.error("criarPedido saldos:", sErr);
      return { ok: false, error: "Falha ao verificar estoque" };
    }
    const saldoPorItem = new Map(
      (saldos ?? []).map((s) => [s.id, Number(s.quantidade_atual)]),
    );
    for (const p of itensComVinculo) {
      const pedido = parsed.data.itens.find((i) => i.produto_id === p.id)!;
      const disponivel = saldoPorItem.get(p.item_estoque_id!) ?? 0;
      if (disponivel < pedido.quantidade) {
        return {
          ok: false,
          error: `Estoque insuficiente para "${p.titulo}" (disponível: ${disponivel})`,
        };
      }
    }
  }

  let subtotal = 0;
  const itensInsertBase = parsed.data.itens.map((it) => {
    const prod = produtos.find((p) => p.id === it.produto_id)!;
    const preco = Number(prod.preco_promocional ?? prod.preco);
    subtotal += preco * it.quantidade;
    return {
      produto_id: prod.id,
      titulo_snapshot: prod.titulo,
      preco_unitario: preco,
      quantidade: it.quantidade,
    };
  });

  const { data: pedido, error: ordErr } = await supabase
    .from("pedidos_loja")
    .insert({
      cliente_nome: parsed.data.cliente_nome,
      cliente_telefone: parsed.data.cliente_telefone,
      cliente_email: parsed.data.cliente_email ?? null,
      cliente_endereco: parsed.data.cliente_endereco,
      observacoes_cliente: parsed.data.observacoes_cliente ?? null,
      valor_subtotal: subtotal,
      valor_frete: 0,
      valor_total: subtotal,
    })
    .select("*")
    .single();
  if (ordErr || !pedido) {
    console.error("criarPedido pedido:", ordErr);
    return { ok: false, error: "Não foi possível criar o pedido" };
  }

  const { error: itEnsErr } = await supabase.from("itens_pedido_loja").insert(
    itensInsertBase.map((it) => ({ ...it, pedido_id: pedido.id })),
  );
  if (itEnsErr) {
    await supabase.from("pedidos_loja").delete().eq("id", pedido.id);
    console.error("criarPedido itens:", itEnsErr);
    return { ok: false, error: "Não foi possível criar os itens do pedido" };
  }

  const chave = process.env.PIX_CHAVE ?? "pedro@example.com";
  const nome = process.env.PIX_NOME_BENEFICIARIO ?? "Pedro Silva";
  const cidade = process.env.PIX_CIDADE ?? "Cidade";

  const pixText = gerarPixBRCode({
    chave,
    nome,
    cidade,
    valor: Number(pedido.valor_total),
    txid: `PED${pedido.numero}`,
  });

  // TODO(sprint-5): enviar WhatsApp para o cliente confirmando pedido criado
  // com link /pedido/{pedido.id}?tel={cliente_telefone}. Também notificar Pedro
  // via mensagem interna ou push quando estiver implementado.

  revalidatePath("/app/loja");
  revalidatePath("/app/loja/pedidos");
  return {
    ok: true,
    data: {
      pedidoId: pedido.id,
      numero: pedido.numero,
      valorTotal: Number(pedido.valor_total),
      pix: { qrText: pixText, chave, valor: Number(pedido.valor_total) },
    },
  };
}

const MAX_COMPROVANTE_BYTES = 5 * 1024 * 1024;

export async function uploadComprovante(
  pedidoId: string,
  formData: FormData,
): Promise<Result<{ comprovante_url: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Arquivo não enviado" };
  }
  if (file.size > MAX_COMPROVANTE_BYTES) {
    return { ok: false, error: "Arquivo maior que 5MB" };
  }

  const supabase = createServiceClient();
  const { data: pedido } = await supabase
    .from("pedidos_loja")
    .select("id, status")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return { ok: false, error: "Pedido não encontrado" };
  if (pedido.status !== "aguardando_pagamento" && pedido.status !== "pagamento_em_analise") {
    return { ok: false, error: "Pedido não aceita novo comprovante" };
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${pedidoId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("loja-comprovantes")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
  if (upErr) {
    console.error("uploadComprovante storage:", upErr);
    return { ok: false, error: "Falha no upload" };
  }

  const { error: updErr } = await supabase
    .from("pedidos_loja")
    .update({ comprovante_url: path, status: "pagamento_em_analise" })
    .eq("id", pedidoId);
  if (updErr) {
    console.error("uploadComprovante update:", updErr);
    return { ok: false, error: "Falha ao registrar comprovante" };
  }

  // TODO(sprint-5): notificar Pedro de novo comprovante pendente.

  revalidatePath(`/pedido/${pedidoId}`);
  revalidatePath("/app/loja/pedidos");
  revalidatePath(`/app/loja/pedidos/${pedidoId}`);
  return { ok: true, data: { comprovante_url: path } };
}
