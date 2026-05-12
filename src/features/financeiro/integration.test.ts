/**
 * Testes de integração que tocam o banco real (Supabase remoto ou local).
 *
 * Habilitar com:
 *   RUN_DB_INTEGRATION=1 pnpm test src/features/financeiro/integration
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY no env.
 * Cada teste limpa o próprio rastro no afterAll.
 */

import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

const SHOULD_RUN =
  process.env.RUN_DB_INTEGRATION === "1" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const STAMP = `it-${Date.now()}`;
const TAG = `[${STAMP}]`;

const supabase = SHOULD_RUN
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  : null;

describe.skipIf(!SHOULD_RUN)("financeiro — integração SQL", () => {
  let clienteId: string;
  let veiculoId: string;
  let osId: string;

  beforeAll(async () => {
    if (!supabase) throw new Error("supabase nulo");

    const { data: cliente } = await supabase
      .from("clientes")
      .insert({ nome: `${TAG} cliente`, telefone: "11999999999" })
      .select("id")
      .single();
    clienteId = cliente!.id;

    const { data: veiculo } = await supabase
      .from("veiculos")
      .insert({
        cliente_id: clienteId,
        modelo_custom: `${TAG} Modelo`,
        motor: "1.0",
        placa: STAMP.slice(0, 7).toUpperCase(),
      })
      .select("id")
      .single();
    veiculoId = veiculo!.id;

    const { data: os } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: clienteId,
        veiculo_id: veiculoId,
        descricao_problema: `${TAG} OS`,
      })
      .select("id")
      .single();
    osId = os!.id;

    // adiciona um serviço pra ter total_geral > 0
    await supabase
      .from("os_servicos")
      .insert({ os_id: osId, descricao: "Test", valor_unitario: 100, quantidade: 1 });
  });

  afterAll(async () => {
    if (!supabase) return;
    await supabase.from("pagamentos").delete().eq("os_id", osId);
    await supabase.from("ordens_servico").delete().eq("id", osId);
    await supabase.from("veiculos").delete().eq("id", veiculoId);
    await supabase.from("clientes").delete().eq("id", clienteId);
  });

  it("marca_pagamentos_atrasados muda pendentes vencidos para atrasado", async () => {
    if (!supabase) throw new Error("supabase nulo");

    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().slice(0, 10);

    const { data: pgto } = await supabase
      .from("pagamentos")
      .insert({
        os_id: osId,
        ordem: 1,
        valor: 50,
        metodo: "pix",
        data_prevista: ontemStr,
        status: "pendente",
      })
      .select("*")
      .single();
    expect(pgto!.status).toBe("pendente");

    const { data: count } = await supabase.rpc("marca_pagamentos_atrasados");
    expect(count).toBeGreaterThanOrEqual(1);

    const { data: depois } = await supabase
      .from("pagamentos")
      .select("status")
      .eq("id", pgto!.id)
      .single();
    expect(depois!.status).toBe("atrasado");

    await supabase.from("pagamentos").delete().eq("id", pgto!.id);
  });

  it("view_contas_a_receber agrega valores corretos por cliente", async () => {
    if (!supabase) throw new Error("supabase nulo");

    await supabase.from("pagamentos").insert([
      { os_id: osId, ordem: 1, valor: 100, metodo: "pix", status: "pendente" },
      { os_id: osId, ordem: 2, valor: 200, metodo: "pix", status: "pendente" },
      { os_id: osId, ordem: 3, valor: 50, metodo: "pix", status: "pago" },
    ]);

    const { data: rows } = await supabase
      .from("view_contas_a_receber")
      .select("*")
      .eq("cliente_id", clienteId);

    const row = rows?.[0];
    expect(row).toBeDefined();
    expect(Number(row!.total_em_aberto)).toBe(300);
    expect(Number(row!.parcelas_em_aberto)).toBe(2);

    await supabase.from("pagamentos").delete().eq("os_id", osId);
  });

  it("trigger trg_pedido_itens_recalc atualiza valor_total do pedido", async () => {
    if (!supabase) throw new Error("supabase nulo");

    const { data: fornecedor } = await supabase
      .from("fornecedores")
      .insert({ nome: `${TAG} fornecedor` })
      .select("id")
      .single();

    const { data: pedido } = await supabase
      .from("pedidos_fornecedor")
      .insert({ fornecedor_id: fornecedor!.id, os_id: osId })
      .select("*")
      .single();

    await supabase.from("pedido_fornecedor_itens").insert([
      { pedido_id: pedido!.id, descricao: "X", custo_unitario: 10, quantidade: 2 },
      { pedido_id: pedido!.id, descricao: "Y", custo_unitario: 5, quantidade: 4 },
    ]);

    const { data: depois } = await supabase
      .from("pedidos_fornecedor")
      .select("valor_total")
      .eq("id", pedido!.id)
      .single();
    expect(Number(depois!.valor_total)).toBe(40); // 10*2 + 5*4

    await supabase.from("pedidos_fornecedor").delete().eq("id", pedido!.id);
    await supabase.from("fornecedores").delete().eq("id", fornecedor!.id);
  });
});
