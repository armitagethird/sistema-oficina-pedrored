/**
 * Testes de integração que tocam o banco real.
 *
 * Habilitar com:
 *   RUN_DB_INTEGRATION=1 pnpm test src/features/loja/integration
 *
 * Cobre:
 *   - Constraint produtos_loja_sob_encomenda_sem_estoque
 *   - Trigger trg_itens_estoque_loja_status (auto-esgotado / auto-reativado)
 *   - criarPedido bloqueia checkout com saldo insuficiente
 *   - criarPedido permite checkout para produto sob encomenda
 */

import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { criarPedido } from "@/app/(public)/checkout/actions";

const SHOULD_RUN =
  process.env.RUN_DB_INTEGRATION === "1" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const STAMP = `it-loja-${Date.now()}`;
const TAG = `[${STAMP}]`;

const supabase = SHOULD_RUN
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  : null;

describe.skipIf(!SHOULD_RUN)("loja — sob encomenda + saldo + trigger", () => {
  let categoriaId: string;
  const itemIds: string[] = [];
  const produtoIds: string[] = [];
  const pedidoIds: string[] = [];

  beforeAll(async () => {
    if (!supabase) throw new Error("supabase nulo");
    const { data, error } = await supabase
      .from("categorias_estoque")
      .insert({ nome: `${TAG} cat`, ordem: 99 })
      .select("id")
      .single();
    if (error) throw error;
    categoriaId = data!.id;
  });

  afterAll(async () => {
    if (!supabase) return;
    for (const pid of pedidoIds) {
      await supabase.from("itens_pedido_loja").delete().eq("pedido_id", pid);
      await supabase.from("pedidos_loja").delete().eq("id", pid);
    }
    for (const prodId of produtoIds) {
      await supabase.from("produtos_loja").delete().eq("id", prodId);
    }
    for (const itemId of itemIds) {
      await supabase
        .from("movimentacoes_estoque")
        .delete()
        .eq("item_id", itemId);
      await supabase.from("itens_estoque").delete().eq("id", itemId);
    }
    await supabase.from("categorias_estoque").delete().eq("id", categoriaId);
  });

  async function novoItem(descricao: string, qtdInicial = 0) {
    const { data, error } = await supabase!
      .from("itens_estoque")
      .insert({
        categoria_id: categoriaId,
        descricao: `${TAG} ${descricao}`,
        unidade: "un",
        preco_venda: 100,
      })
      .select("*")
      .single();
    if (error) throw error;
    itemIds.push(data!.id);
    if (qtdInicial > 0) {
      await supabase!.rpc("aplicar_movimentacao_estoque", {
        p_item_id: data!.id,
        p_tipo: "entrada",
        p_quantidade: qtdInicial,
        p_custo_unitario: 50,
      });
    }
    return data!;
  }

  async function novoProduto(opts: {
    titulo: string;
    item_estoque_id?: string | null;
    somente_sob_encomenda?: boolean;
  }) {
    const { data: slug } = await supabase!.rpc("gerar_slug_unico", {
      p_titulo: `${TAG} ${opts.titulo}`,
    });
    const { data, error } = await supabase!
      .from("produtos_loja")
      .insert({
        titulo: `${TAG} ${opts.titulo}`,
        slug: slug as string,
        preco: 100,
        item_estoque_id: opts.item_estoque_id ?? null,
        somente_sob_encomenda: opts.somente_sob_encomenda ?? false,
      })
      .select("*")
      .single();
    if (error) throw error;
    produtoIds.push(data!.id);
    return data!;
  }

  it("constraint: produto sob encomenda + item_estoque_id é rejeitado", async () => {
    const item = await novoItem("Item constraint");
    const { data: slug } = await supabase!.rpc("gerar_slug_unico", {
      p_titulo: `${TAG} constraint`,
    });
    const { error } = await supabase!.from("produtos_loja").insert({
      titulo: `${TAG} constraint`,
      slug: slug as string,
      preco: 50,
      item_estoque_id: item.id,
      somente_sob_encomenda: true,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/produtos_loja_sob_encomenda_sem_estoque/);
  });

  it("trigger: saldo cruza zero → produto vinculado vira esgotado", async () => {
    const item = await novoItem("Item esgota", 2);
    const produto = await novoProduto({
      titulo: "Prod esgota",
      item_estoque_id: item.id,
    });
    expect(produto.status).toBe("ativo");

    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "saida_loja",
      p_quantidade: 2,
    });

    const { data: refreshed } = await supabase!
      .from("produtos_loja")
      .select("status")
      .eq("id", produto.id)
      .single();
    expect(refreshed!.status).toBe("esgotado");
  });

  it("trigger: nova entrada após esgotar reativa o produto", async () => {
    const item = await novoItem("Item reativa", 1);
    const produto = await novoProduto({
      titulo: "Prod reativa",
      item_estoque_id: item.id,
    });

    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "saida_loja",
      p_quantidade: 1,
    });
    const { data: esgotado } = await supabase!
      .from("produtos_loja")
      .select("status")
      .eq("id", produto.id)
      .single();
    expect(esgotado!.status).toBe("esgotado");

    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "entrada",
      p_quantidade: 5,
      p_custo_unitario: 30,
    });
    const { data: ativo } = await supabase!
      .from("produtos_loja")
      .select("status")
      .eq("id", produto.id)
      .single();
    expect(ativo!.status).toBe("ativo");
  });

  it("trigger: produto inativo NÃO é tocado pelo trigger", async () => {
    const item = await novoItem("Item inativo guard", 3);
    const produto = await novoProduto({
      titulo: "Prod inativo",
      item_estoque_id: item.id,
    });
    await supabase!
      .from("produtos_loja")
      .update({ status: "inativo" })
      .eq("id", produto.id);

    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "saida_loja",
      p_quantidade: 3,
    });

    const { data: refreshed } = await supabase!
      .from("produtos_loja")
      .select("status")
      .eq("id", produto.id)
      .single();
    expect(refreshed!.status).toBe("inativo");
  });

  it("criarPedido: bloqueia quando saldo insuficiente", async () => {
    const item = await novoItem("Item saldo bloq", 1);
    const produto = await novoProduto({
      titulo: "Prod saldo bloq",
      item_estoque_id: item.id,
    });

    const result = await criarPedido({
      cliente_nome: "Cliente Teste",
      cliente_telefone: "(11) 99999-0000",
      cliente_email: null,
      cliente_endereco: {
        cep: "01000-000",
        rua: "Rua A",
        numero: "1",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        complemento: null,
      },
      observacoes_cliente: null,
      itens: [{ produto_id: produto.id, quantidade: 5 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Estoque insuficiente/);
      expect(result.error).toMatch(/disponível: 1/);
    }
  });

  it("criarPedido: permite quando produto é sob encomenda (sem checagem de saldo)", async () => {
    const produto = await novoProduto({
      titulo: "Prod sob encomenda",
      somente_sob_encomenda: true,
    });

    const result = await criarPedido({
      cliente_nome: "Cliente Encomenda",
      cliente_telefone: "(11) 98888-1111",
      cliente_email: null,
      cliente_endereco: {
        cep: "01000-000",
        rua: "Rua B",
        numero: "10",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        complemento: null,
      },
      observacoes_cliente: null,
      itens: [{ produto_id: produto.id, quantidade: 10 }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) pedidoIds.push(result.data.pedidoId);
  });

  it("criarPedido: permite quando saldo é exatamente igual ao pedido", async () => {
    const item = await novoItem("Item saldo exato", 3);
    const produto = await novoProduto({
      titulo: "Prod saldo exato",
      item_estoque_id: item.id,
    });

    const result = await criarPedido({
      cliente_nome: "Cliente Exato",
      cliente_telefone: "(11) 97777-2222",
      cliente_email: null,
      cliente_endereco: {
        cep: "01000-000",
        rua: "Rua C",
        numero: "20",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        complemento: null,
      },
      observacoes_cliente: null,
      itens: [{ produto_id: produto.id, quantidade: 3 }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) pedidoIds.push(result.data.pedidoId);
  });
});
