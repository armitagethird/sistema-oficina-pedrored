/**
 * Testes de integração que tocam o banco real.
 *
 * Habilitar com:
 *   RUN_DB_INTEGRATION=1 pnpm test src/features/estoque/integration
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY no env.
 * Cada teste limpa seu rastro no afterAll.
 */

import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

const SHOULD_RUN =
  process.env.RUN_DB_INTEGRATION === "1" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const STAMP = `it-est-${Date.now()}`;
const TAG = `[${STAMP}]`;

const supabase = SHOULD_RUN
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  : null;

describe.skipIf(!SHOULD_RUN)("estoque — função aplicar_movimentacao_estoque", () => {
  let categoriaId: string;
  const itemIds: string[] = [];

  beforeAll(async () => {
    if (!supabase) throw new Error("supabase nulo");
    const { data } = await supabase
      .from("categorias_estoque")
      .insert({ nome: `${TAG} cat`, ordem: 99 })
      .select("id")
      .single();
    categoriaId = data!.id;
  });

  afterAll(async () => {
    if (!supabase) return;
    // Apaga movimentações dos itens criados aqui antes de deletar itens
    for (const id of itemIds) {
      await supabase.from("movimentacoes_estoque").delete().eq("item_id", id);
      await supabase.from("itens_estoque").delete().eq("id", id);
    }
    await supabase.from("categorias_estoque").delete().eq("id", categoriaId);
  });

  async function novoItem(descricao: string) {
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
    return data!;
  }

  it("entrada inicial: saldo = qtd, custo_medio = custo_unitario", async () => {
    const item = await novoItem("Item entrada inicial");
    const { error } = await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "entrada",
      p_quantidade: 5,
      p_custo_unitario: 10,
    });
    expect(error).toBeNull();
    const { data } = await supabase!
      .from("itens_estoque")
      .select("quantidade_atual, custo_medio")
      .eq("id", item.id)
      .single();
    expect(Number(data!.quantidade_atual)).toBe(5);
    expect(Number(data!.custo_medio)).toBe(10);
  });

  it("duas entradas com custos diferentes: custo médio ponderado", async () => {
    const item = await novoItem("Item custo medio");
    // 5 a R$10 + 5 a R$20 → saldo 10, custo médio (5*10 + 5*20)/10 = 15
    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "entrada",
      p_quantidade: 5,
      p_custo_unitario: 10,
    });
    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "entrada",
      p_quantidade: 5,
      p_custo_unitario: 20,
    });
    const { data } = await supabase!
      .from("itens_estoque")
      .select("quantidade_atual, custo_medio")
      .eq("id", item.id)
      .single();
    expect(Number(data!.quantidade_atual)).toBe(10);
    expect(Number(data!.custo_medio)).toBe(15);
  });

  it("saída válida reduz saldo", async () => {
    const item = await novoItem("Item saida");
    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "entrada",
      p_quantidade: 10,
      p_custo_unitario: 5,
    });
    const { error } = await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "saida_loja",
      p_quantidade: 3,
    });
    expect(error).toBeNull();
    const { data } = await supabase!
      .from("itens_estoque")
      .select("quantidade_atual")
      .eq("id", item.id)
      .single();
    expect(Number(data!.quantidade_atual)).toBe(7);
  });

  it("saída maior que saldo levanta erro 'Estoque insuficiente'", async () => {
    const item = await novoItem("Item insuficiente");
    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "entrada",
      p_quantidade: 2,
      p_custo_unitario: 5,
    });
    const { error } = await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "saida_loja",
      p_quantidade: 10,
    });
    expect(error).not.toBeNull();
    expect(error!.message.toLowerCase()).toContain("insuficiente");
  });

  it("ajuste soma quantidade e exige motivo", async () => {
    const item = await novoItem("Item ajuste");
    await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "entrada",
      p_quantidade: 5,
      p_custo_unitario: 8,
    });
    // sem motivo → erro
    const { error: noMot } = await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "ajuste",
      p_quantidade: 1,
    });
    expect(noMot).not.toBeNull();
    // com motivo → soma
    const { error } = await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "ajuste",
      p_quantidade: 2,
      p_ajuste_motivo: "correção inventário",
    });
    expect(error).toBeNull();
    const { data } = await supabase!
      .from("itens_estoque")
      .select("quantidade_atual, custo_medio")
      .eq("id", item.id)
      .single();
    expect(Number(data!.quantidade_atual)).toBe(7);
    expect(Number(data!.custo_medio)).toBe(8); // ajuste não muda custo médio
  });

  it("entrada sem custo_unitario falha", async () => {
    const item = await novoItem("Item sem custo");
    const { error } = await supabase!.rpc("aplicar_movimentacao_estoque", {
      p_item_id: item.id,
      p_tipo: "entrada",
      p_quantidade: 1,
    });
    expect(error).not.toBeNull();
    expect(error!.message.toLowerCase()).toContain("custo_unitario");
  });
});
