"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  agendamentoCreateSchema,
  agendamentoUpdateSchema,
  capacidadeOverrideSchema,
  mudarStatusAgendamentoSchema,
  settingsCapacidadeSchema,
  type AgendamentoCreateInput,
  type AgendamentoUpdateInput,
  type CapacidadeOverrideInput,
  type SettingsCapacidadeInput,
} from "./schemas";
import {
  isTransitionAllowed,
  STATUS_LABEL,
  type Agendamento,
  type AgendamentoUpdate,
  type AgendaPeriodo,
  type AgendaStatus,
  type CapacidadeOverride,
  type OcupacaoDia,
} from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateAgenda(id?: string) {
  revalidatePath("/app/agenda");
  revalidatePath("/app/agenda/semana");
  revalidatePath("/app/agenda/mes");
  if (id) revalidatePath(`/app/agenda/${id}`);
}

export async function createAgendamento(
  input: AgendamentoCreateInput,
): Promise<ActionResult<Agendamento & { warning?: "capacidade_excedida" }>> {
  const parsed = agendamentoCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const supabase = await createClient();

  const periodo = parsed.data.periodo as AgendaPeriodo;

  // Verificar capacidade (aviso, não bloqueio)
  const { data: ocupacao } = await supabase.rpc("ocupacao_dia", {
    p_data: parsed.data.data,
    p_periodo: periodo,
  });
  const slot = ocupacao?.[0] as OcupacaoDia | undefined;
  const capacidadeExcedida = slot ? slot.disponivel <= 0 : false;

  const { data, error } = await supabase
    .from("agendamentos")
    .insert({
      cliente_id: parsed.data.cliente_id,
      veiculo_id: parsed.data.veiculo_id ?? null,
      data: parsed.data.data,
      periodo,
      descricao: parsed.data.descricao,
      observacoes: parsed.data.observacoes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createAgendamento:", error);
    return { ok: false, error: "Não foi possível criar o agendamento" };
  }

  revalidateAgenda(data.id);

  return {
    ok: true,
    data: {
      ...data,
      ...(capacidadeExcedida
        ? { warning: "capacidade_excedida" as const }
        : {}),
    },
  };
}

export async function updateAgendamento(
  id: string,
  input: AgendamentoUpdateInput,
): Promise<ActionResult<Agendamento>> {
  const parsed = agendamentoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (
    current?.status === "concluido" ||
    current?.status === "cancelado" ||
    current?.status === "nao_compareceu"
  ) {
    return {
      ok: false,
      error: `Agendamento ${STATUS_LABEL[current.status as AgendaStatus]} não pode ser editado.`,
    };
  }

  const patch: AgendamentoUpdate = {};
  if (parsed.data.veiculo_id !== undefined)
    patch.veiculo_id = parsed.data.veiculo_id ?? null;
  if (parsed.data.data !== undefined) patch.data = parsed.data.data;
  if (parsed.data.periodo !== undefined)
    patch.periodo = parsed.data.periodo as AgendaPeriodo;
  if (parsed.data.descricao !== undefined)
    patch.descricao = parsed.data.descricao;
  if (parsed.data.observacoes !== undefined)
    patch.observacoes = parsed.data.observacoes?.trim() || null;

  const { data, error } = await supabase
    .from("agendamentos")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("updateAgendamento:", error);
    return { ok: false, error: "Não foi possível atualizar o agendamento" };
  }

  revalidateAgenda(id);
  return { ok: true, data };
}

export async function mudarStatusAgendamento(
  id: string,
  novoStatus: AgendaStatus,
): Promise<ActionResult<Agendamento>> {
  const parsed = mudarStatusAgendamentoSchema.safeParse({
    novo_status: novoStatus,
  });
  if (!parsed.success) {
    return { ok: false, error: "Status inválido" };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!current) return { ok: false, error: "Agendamento não encontrado" };

  if (!isTransitionAllowed(current.status as AgendaStatus, novoStatus)) {
    return {
      ok: false,
      error: `Transição inválida: ${STATUS_LABEL[current.status as AgendaStatus]} → ${STATUS_LABEL[novoStatus]}`,
    };
  }

  const { data, error } = await supabase
    .from("agendamentos")
    .update({ status: novoStatus })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("mudarStatusAgendamento:", error);
    return { ok: false, error: "Não foi possível mudar o status" };
  }

  revalidateAgenda(id);
  return { ok: true, data };
}

export async function deleteAgendamento(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!current) return { ok: false, error: "Agendamento não encontrado" };
  if (current.status === "em_andamento") {
    return {
      ok: false,
      error: "Não é possível excluir agendamento em andamento.",
    };
  }

  const { error } = await supabase
    .from("agendamentos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteAgendamento:", error);
    return { ok: false, error: "Não foi possível excluir o agendamento" };
  }

  revalidateAgenda();
  return { ok: true, data: undefined };
}

export async function criarOSFromAgendamento(
  agendamentoId: string,
): Promise<ActionResult<{ os_id: string }>> {
  const supabase = await createClient();

  const { data: ag } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("id", agendamentoId)
    .maybeSingle();

  if (!ag) return { ok: false, error: "Agendamento não encontrado" };
  if (ag.os_id) return { ok: false, error: "OS já criada para este agendamento" };
  if (!ag.veiculo_id) {
    return {
      ok: false,
      error: "Agendamento precisa de veículo para criar OS",
    };
  }

  const { data: os, error: osError } = await supabase
    .from("ordens_servico")
    .insert({
      cliente_id: ag.cliente_id,
      veiculo_id: ag.veiculo_id,
      descricao_problema: ag.descricao,
      observacoes: ag.observacoes ?? null,
      agendamento_id: agendamentoId,
    })
    .select("id")
    .single();

  if (osError) {
    console.error("criarOSFromAgendamento os:", osError);
    return { ok: false, error: "Não foi possível criar a OS" };
  }

  const { error: linkError } = await supabase
    .from("agendamentos")
    .update({ os_id: os.id, status: "em_andamento" })
    .eq("id", agendamentoId);

  if (linkError) {
    console.error("criarOSFromAgendamento link:", linkError);
  }

  revalidatePath("/app/os");
  revalidatePath(`/app/os/${os.id}`);
  revalidateAgenda(agendamentoId);

  return { ok: true, data: { os_id: os.id } };
}

export async function setCapacidadeOverride(
  input: CapacidadeOverrideInput,
): Promise<ActionResult<CapacidadeOverride>> {
  const parsed = capacidadeOverrideSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("capacidade_overrides")
    .upsert(
      {
        data: parsed.data.data,
        periodo: parsed.data.periodo as AgendaPeriodo,
        capacidade: parsed.data.capacidade,
        motivo: parsed.data.motivo?.trim() || null,
      },
      { onConflict: "data,periodo" },
    )
    .select("*")
    .single();

  if (error) {
    console.error("setCapacidadeOverride:", error);
    return { ok: false, error: "Não foi possível salvar o override" };
  }

  revalidateAgenda();
  return { ok: true, data };
}

export async function updateSettingsCapacidade(
  input: SettingsCapacidadeInput,
): Promise<ActionResult> {
  const parsed = settingsCapacidadeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const supabase = await createClient();

  const updates = [
    {
      chave: "agenda_capacidade_manha",
      valor: String(parsed.data.capacidade_manha),
    },
    {
      chave: "agenda_capacidade_tarde",
      valor: String(parsed.data.capacidade_tarde),
    },
  ];

  for (const u of updates) {
    const { error } = await supabase
      .from("settings")
      .update({ valor: u.valor })
      .eq("chave", u.chave);

    if (error) {
      console.error("updateSettingsCapacidade:", error);
      return { ok: false, error: "Não foi possível salvar as configurações" };
    }
  }

  revalidateAgenda();
  return { ok: true, data: undefined };
}

export async function getOcupacaoAction(
  data: string,
  periodo: "manha" | "tarde",
): Promise<ActionResult<OcupacaoDia>> {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("ocupacao_dia", {
    p_data: data,
    p_periodo: periodo,
  });

  if (error) {
    console.error("getOcupacaoAction:", error);
    return { ok: false, error: "Não foi possível verificar ocupação" };
  }

  const slot = result?.[0] as OcupacaoDia | undefined;
  if (!slot) return { ok: false, error: "Dados não encontrados" };

  return { ok: true, data: slot };
}
