# Sprint 4 — Agenda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o módulo de Agenda com visualizações hoje/semana/mês, agendamentos por período (manhã/tarde), controle de capacidade e criação de OS a partir do agendamento.

**Architecture:** Feature-first em `src/features/agenda/` com server components por default; mutações via server actions; capacidade consultada via RPC Supabase `ocupacao_dia()`; nenhum pacote novo necessário (date-fns e react-day-picker já instalados).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase, date-fns 4, react-day-picker 10, shadcn/ui (Calendar já instalado), Tailwind CSS v4, Zod, Vitest, Playwright.

---

## File Structure

**New files (create):**
- `supabase/migrations/20260701000000_init_agenda.sql`
- `supabase/migrations/20260701000001_alter_os_agendamento_fk.sql`
- `src/features/agenda/types.ts`
- `src/features/agenda/schemas.ts`
- `src/features/agenda/schemas.test.ts`
- `src/features/agenda/queries.ts`
- `src/features/agenda/actions.ts`
- `src/features/agenda/constants.ts`
- `src/features/agenda/components/AgendaStatusBadge.tsx`
- `src/features/agenda/components/OcupacaoIndicator.tsx`
- `src/features/agenda/components/AgendamentoCard.tsx`
- `src/features/agenda/components/PeriodoCard.tsx`
- `src/features/agenda/components/AgendaHoje.tsx`
- `src/features/agenda/components/AgendaSemana.tsx`
- `src/features/agenda/components/AgendaMesCalendario.tsx`
- `src/features/agenda/components/AgendamentoForm.tsx`
- `src/features/agenda/components/CapacidadeConfig.tsx`
- `src/features/agenda/components/MudarStatusAgendamento.tsx`
- `src/app/(admin)/app/agenda/page.tsx`
- `src/app/(admin)/app/agenda/novo/page.tsx`
- `src/app/(admin)/app/agenda/semana/page.tsx`
- `src/app/(admin)/app/agenda/mes/page.tsx`
- `src/app/(admin)/app/agenda/[id]/page.tsx`
- `src/app/(admin)/app/agenda/[id]/editar/page.tsx`
- `src/app/(admin)/app/agenda/configuracoes/page.tsx`
- `tests/e2e/agenda.spec.ts`

**Modified files:**
- `src/app/(admin)/app/page.tsx` — ativar link da Agenda no dashboard
- `src/app/(admin)/app/os/[id]/page.tsx` — mostrar agendamento vinculado
- `docs/00-overview.md` — marcar Sprint 4 como implementada
- `docs/sprints/sprint-04-agenda.md` — atualizar checklist

---

### Task 1: Migrations — Schema Agenda + FK na OS

**Files:**
- Create: `supabase/migrations/20260701000000_init_agenda.sql`
- Create: `supabase/migrations/20260701000001_alter_os_agendamento_fk.sql`

- [ ] **Step 1.1: Criar migration principal da agenda**

```sql
-- supabase/migrations/20260701000000_init_agenda.sql

-- Enums
create type agenda_periodo as enum ('manha', 'tarde');

create type agenda_status as enum (
  'agendado',
  'confirmado',
  'em_andamento',
  'concluido',
  'cancelado',
  'nao_compareceu'
);

-- Tabela principal de agendamentos
create table agendamentos (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references clientes(id) on delete restrict,
  veiculo_id    uuid references veiculos(id) on delete set null,
  os_id         uuid references ordens_servico(id) on delete set null,
  data          date not null,
  periodo       agenda_periodo not null,
  status        agenda_status not null default 'agendado',
  descricao     text not null,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_agendamentos_data on agendamentos(data);
create index idx_agendamentos_cliente on agendamentos(cliente_id);
create index idx_agendamentos_status on agendamentos(status);
create index idx_agendamentos_data_periodo on agendamentos(data, periodo);

-- Overrides de capacidade por dia/período
create table capacidade_overrides (
  id         uuid primary key default gen_random_uuid(),
  data       date not null,
  periodo    agenda_periodo not null,
  capacidade integer not null check (capacidade >= 0),
  motivo     text,
  unique(data, periodo)
);

-- Tabela de configurações gerais
create table settings (
  chave text primary key,
  valor text not null,
  descricao text
);

-- Seed de capacidade padrão
insert into settings (chave, valor, descricao) values
  ('agenda_capacidade_manha', '3', 'Capacidade padrão para o período da manhã'),
  ('agenda_capacidade_tarde', '3', 'Capacidade padrão para o período da tarde');

-- Função RPC: ocupação de um dia/período
create or replace function ocupacao_dia(p_data date, p_periodo agenda_periodo)
returns table(
  capacidade_padrao integer,
  capacidade_override integer,
  capacidade_efetiva integer,
  ocupados integer,
  disponivel integer
)
language plpgsql security definer as $$
declare
  v_cap_padrao integer;
  v_cap_override integer;
  v_cap_efetiva integer;
  v_ocupados integer;
  v_chave text;
begin
  -- capacidade padrão do settings
  v_chave := 'agenda_capacidade_' || p_periodo::text;
  select coalesce(nullif(valor, '')::integer, 3)
    into v_cap_padrao
    from settings
   where chave = v_chave;
  if v_cap_padrao is null then v_cap_padrao := 3; end if;

  -- override do dia (se existir)
  select co.capacidade
    into v_cap_override
    from capacidade_overrides co
   where co.data = p_data and co.periodo = p_periodo;

  v_cap_efetiva := coalesce(v_cap_override, v_cap_padrao);

  -- contagem de agendamentos ocupando o slot
  select count(*)
    into v_ocupados
    from agendamentos a
   where a.data = p_data
     and a.periodo = p_periodo
     and a.status not in ('cancelado', 'nao_compareceu');

  v_disponivel := greatest(0, v_cap_efetiva - v_ocupados);

  return query select v_cap_padrao, v_cap_override, v_cap_efetiva, v_ocupados, v_disponivel;
end;
$$;

-- Trigger: atualizar atualizado_em
create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger trg_agendamentos_atualizado_em
  before update on agendamentos
  for each row execute function set_atualizado_em();

-- RLS
alter table agendamentos enable row level security;
alter table capacidade_overrides enable row level security;
alter table settings enable row level security;

create policy "authenticated_all" on agendamentos
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on capacidade_overrides
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on settings
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 1.2: Criar migration FK na tabela ordens_servico**

```sql
-- supabase/migrations/20260701000001_alter_os_agendamento_fk.sql

alter table ordens_servico
  add column agendamento_id uuid references agendamentos(id) on delete set null;

create index idx_ordens_servico_agendamento on ordens_servico(agendamento_id);
```

- [ ] **Step 1.3: Aplicar migrations e regenerar tipos**

```bash
pnpm db:migrate
pnpm db:gen
```

Saída esperada: sem erros, `src/lib/supabase/database.types.ts` atualizado com `agendamentos`, `capacidade_overrides`, `settings`.

- [ ] **Step 1.4: Commit**

```bash
git add supabase/migrations/ src/lib/supabase/database.types.ts
git commit -m "feat(agenda): add agenda schema, RPC ocupacao_dia, settings table"
```

---

### Task 2: Types + Constants

**Files:**
- Create: `src/features/agenda/constants.ts`
- Create: `src/features/agenda/types.ts`

- [ ] **Step 2.1: Criar constants.ts**

```typescript
// src/features/agenda/constants.ts

export const AGENDA_PERIODOS = ["manha", "tarde"] as const;
export const AGENDA_STATUSES = [
  "agendado",
  "confirmado",
  "em_andamento",
  "concluido",
  "cancelado",
  "nao_compareceu",
] as const;
```

- [ ] **Step 2.2: Criar types.ts com state machine**

```typescript
// src/features/agenda/types.ts

import type { Database } from "@/lib/supabase/database.types";

export type AgendaPeriodo = Database["public"]["Enums"]["agenda_periodo"];
export type AgendaStatus = Database["public"]["Enums"]["agenda_status"];

export type Agendamento =
  Database["public"]["Tables"]["agendamentos"]["Row"];
export type AgendamentoInsert =
  Database["public"]["Tables"]["agendamentos"]["Insert"];
export type AgendamentoUpdate =
  Database["public"]["Tables"]["agendamentos"]["Update"];

export type CapacidadeOverride =
  Database["public"]["Tables"]["capacidade_overrides"]["Row"];

export type OcupacaoDia = {
  capacidade_padrao: number;
  capacidade_override: number | null;
  capacidade_efetiva: number;
  ocupados: number;
  disponivel: number;
};

export type AgendamentoComRelacoes = Agendamento & {
  clientes: { nome: string; telefone: string | null } | null;
  veiculos: { modelo: string; placa: string | null } | null;
};

const TRANSITIONS: Record<AgendaStatus, readonly AgendaStatus[]> = {
  agendado: ["confirmado", "cancelado", "nao_compareceu"],
  confirmado: ["em_andamento", "cancelado", "nao_compareceu"],
  em_andamento: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
  nao_compareceu: [],
};

export function isTransitionAllowed(
  from: AgendaStatus,
  to: AgendaStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getNextStatuses(current: AgendaStatus): AgendaStatus[] {
  return [...TRANSITIONS[current]];
}

export const STATUS_LABEL: Record<AgendaStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

export const STATUS_COLOR: Record<
  AgendaStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  agendado: "secondary",
  confirmado: "default",
  em_andamento: "default",
  concluido: "outline",
  cancelado: "destructive",
  nao_compareceu: "destructive",
};

export const PERIODO_LABEL: Record<AgendaPeriodo, string> = {
  manha: "Manhã",
  tarde: "Tarde",
};
```

- [ ] **Step 2.3: Commit**

```bash
git add src/features/agenda/constants.ts src/features/agenda/types.ts
git commit -m "feat(agenda): add types and state machine"
```

---

### Task 3: Schemas + TDD

**Files:**
- Create: `src/features/agenda/schemas.ts`
- Create: `src/features/agenda/schemas.test.ts`

- [ ] **Step 3.1: Escrever testes que vão falhar primeiro**

```typescript
// src/features/agenda/schemas.test.ts

import { describe, expect, it } from "vitest";
import {
  agendamentoCreateSchema,
  agendamentoUpdateSchema,
  mudarStatusAgendamentoSchema,
  capacidadeOverrideSchema,
  settingsCapacidadeSchema,
} from "./schemas";

describe("agendamentoCreateSchema", () => {
  it("valida entrada correta", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: "00000000-0000-0000-0000-000000000001",
      veiculo_id: "00000000-0000-0000-0000-000000000002",
      data: "2026-07-15",
      periodo: "manha",
      descricao: "Troca de óleo",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita cliente_id inválido", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: "nao-uuid",
      data: "2026-07-15",
      periodo: "manha",
      descricao: "Troca",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/Cliente inválido/);
  });

  it("rejeita data em formato inválido", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: "00000000-0000-0000-0000-000000000001",
      data: "15/07/2026",
      periodo: "tarde",
      descricao: "Revisão",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita período inválido", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: "00000000-0000-0000-0000-000000000001",
      data: "2026-07-15",
      periodo: "noite",
      descricao: "Revisão",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita descricao vazia", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: "00000000-0000-0000-0000-000000000001",
      data: "2026-07-15",
      periodo: "manha",
      descricao: "",
    });
    expect(result.success).toBe(false);
  });

  it("aceita veiculo_id nulo", () => {
    const result = agendamentoCreateSchema.safeParse({
      cliente_id: "00000000-0000-0000-0000-000000000001",
      veiculo_id: null,
      data: "2026-07-15",
      periodo: "tarde",
      descricao: "Diagnóstico",
    });
    expect(result.success).toBe(true);
  });
});

describe("mudarStatusAgendamentoSchema", () => {
  it("valida status válido", () => {
    const result = mudarStatusAgendamentoSchema.safeParse({
      novo_status: "confirmado",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita status inválido", () => {
    const result = mudarStatusAgendamentoSchema.safeParse({
      novo_status: "suspenso",
    });
    expect(result.success).toBe(false);
  });
});

describe("settingsCapacidadeSchema", () => {
  it("valida capacidades entre 0 e 20", () => {
    const result = settingsCapacidadeSchema.safeParse({
      capacidade_manha: 3,
      capacidade_tarde: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita capacidade negativa", () => {
    const result = settingsCapacidadeSchema.safeParse({
      capacidade_manha: -1,
      capacidade_tarde: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita capacidade acima de 20", () => {
    const result = settingsCapacidadeSchema.safeParse({
      capacidade_manha: 21,
      capacidade_tarde: 3,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3.2: Rodar testes — devem falhar**

```bash
pnpm test src/features/agenda/schemas.test.ts
```

Esperado: FAIL com "Cannot find module './schemas'"

- [ ] **Step 3.3: Criar schemas.ts**

```typescript
// src/features/agenda/schemas.ts

import { z } from "zod";
import { AGENDA_PERIODOS, AGENDA_STATUSES } from "./constants";

export const agendamentoCreateSchema = z.object({
  cliente_id: z.string().uuid("Cliente inválido"),
  veiculo_id: z.string().uuid("Veículo inválido").nullable().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD)"),
  periodo: z.enum(AGENDA_PERIODOS as unknown as [string, ...string[]]),
  descricao: z.string().trim().min(2, "Descrição muito curta").max(500),
  observacoes: z.string().max(1000).optional().nullable(),
});

export const agendamentoUpdateSchema = agendamentoCreateSchema
  .omit({ cliente_id: true })
  .partial();

export const mudarStatusAgendamentoSchema = z.object({
  novo_status: z.enum(AGENDA_STATUSES as unknown as [string, ...string[]]),
});

export const capacidadeOverrideSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  periodo: z.enum(AGENDA_PERIODOS as unknown as [string, ...string[]]),
  capacidade: z.number().int().min(0).max(20),
  motivo: z.string().max(200).optional().nullable(),
});

export const settingsCapacidadeSchema = z.object({
  capacidade_manha: z.number().int().min(0).max(20),
  capacidade_tarde: z.number().int().min(0).max(20),
});

export type AgendamentoCreateInput = z.infer<typeof agendamentoCreateSchema>;
export type AgendamentoUpdateInput = z.infer<typeof agendamentoUpdateSchema>;
export type CapacidadeOverrideInput = z.infer<typeof capacidadeOverrideSchema>;
export type SettingsCapacidadeInput = z.infer<typeof settingsCapacidadeSchema>;
```

- [ ] **Step 3.4: Rodar testes — devem passar**

```bash
pnpm test src/features/agenda/schemas.test.ts
```

Esperado: PASS (todos os casos)

- [ ] **Step 3.5: Commit**

```bash
git add src/features/agenda/schemas.ts src/features/agenda/schemas.test.ts
git commit -m "feat(agenda): add schemas with zod validation (TDD)"
```

---

### Task 4: Queries

**Files:**
- Create: `src/features/agenda/queries.ts`

- [ ] **Step 4.1: Criar queries.ts**

```typescript
// src/features/agenda/queries.ts

import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AgendamentoComRelacoes, AgendaStatus, OcupacaoDia } from "./types";

export type AgendamentosHoje = {
  manha: AgendamentoComRelacoes[];
  tarde: AgendamentoComRelacoes[];
};

const AGENDAMENTO_SELECT = `
  *,
  clientes(nome, telefone),
  veiculos(modelo, placa)
` as const;

export async function getAgendamentosHoje(): Promise<AgendamentosHoje> {
  const supabase = await createClient();
  const hoje = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_SELECT)
    .eq("data", hoje)
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("getAgendamentosHoje:", error);
    return { manha: [], tarde: [] };
  }

  const records = (data ?? []) as AgendamentoComRelacoes[];
  return {
    manha: records.filter((a) => a.periodo === "manha"),
    tarde: records.filter((a) => a.periodo === "tarde"),
  };
}

export async function getAgendamentosSemana(
  dataInicio: string,
  dataFim: string,
): Promise<AgendamentoComRelacoes[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_SELECT)
    .gte("data", dataInicio)
    .lte("data", dataFim)
    .order("data", { ascending: true })
    .order("periodo", { ascending: true });

  if (error) {
    console.error("getAgendamentosSemana:", error);
    return [];
  }

  return (data ?? []) as AgendamentoComRelacoes[];
}

export async function getAgendamentosMes(
  ano: number,
  mes: number,
): Promise<AgendamentoComRelacoes[]> {
  const supabase = await createClient();
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_SELECT)
    .gte("data", dataInicio)
    .lte("data", dataFim)
    .order("data", { ascending: true });

  if (error) {
    console.error("getAgendamentosMes:", error);
    return [];
  }

  return (data ?? []) as AgendamentoComRelacoes[];
}

export async function getAgendamento(
  id: string,
): Promise<AgendamentoComRelacoes | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getAgendamento:", error);
    return null;
  }

  return data as AgendamentoComRelacoes | null;
}

export async function getOcupacaoDia(
  data: string,
  periodo: "manha" | "tarde",
): Promise<OcupacaoDia | null> {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("ocupacao_dia", {
    p_data: data,
    p_periodo: periodo,
  });

  if (error) {
    console.error("getOcupacaoDia:", error);
    return null;
  }

  return result?.[0] ?? null;
}

export async function getSettingsCapacidade(): Promise<{
  manha: number;
  tarde: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("chave, valor")
    .in("chave", ["agenda_capacidade_manha", "agenda_capacidade_tarde"]);

  if (error) {
    console.error("getSettingsCapacidade:", error);
    return { manha: 3, tarde: 3 };
  }

  const map = Object.fromEntries((data ?? []).map((s) => [s.chave, s.valor]));
  return {
    manha: parseInt(map["agenda_capacidade_manha"] ?? "3", 10),
    tarde: parseInt(map["agenda_capacidade_tarde"] ?? "3", 10),
  };
}

export async function getCapacidadeOverridesMes(
  ano: number,
  mes: number,
): Promise<import("./types").CapacidadeOverride[]> {
  const supabase = await createClient();
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

  const { data, error } = await supabase
    .from("capacidade_overrides")
    .select("*")
    .gte("data", dataInicio)
    .lte("data", dataFim);

  if (error) {
    console.error("getCapacidadeOverridesMes:", error);
    return [];
  }

  return data ?? [];
}

export async function getStatusCount(data: string): Promise<
  Record<AgendaStatus, number>
> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("data", data);

  if (error) {
    console.error("getStatusCount:", error);
  }

  const counts: Record<AgendaStatus, number> = {
    agendado: 0,
    confirmado: 0,
    em_andamento: 0,
    concluido: 0,
    cancelado: 0,
    nao_compareceu: 0,
  };

  for (const row of rows ?? []) {
    counts[row.status as AgendaStatus]++;
  }

  return counts;
}
```

- [ ] **Step 4.2: Commit**

```bash
git add src/features/agenda/queries.ts
git commit -m "feat(agenda): add server-side queries"
```

---

### Task 5: Actions

**Files:**
- Create: `src/features/agenda/actions.ts`

- [ ] **Step 5.1: Criar actions.ts**

```typescript
// src/features/agenda/actions.ts

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

  // Verificar capacidade (aviso, não bloqueio)
  const { data: ocupacao } = await supabase.rpc("ocupacao_dia", {
    p_data: parsed.data.data,
    p_periodo: parsed.data.periodo,
  });
  const slot = ocupacao?.[0] as OcupacaoDia | undefined;
  const capacidadeExcedida = slot ? slot.disponivel <= 0 : false;

  const { data, error } = await supabase
    .from("agendamentos")
    .insert({
      cliente_id: parsed.data.cliente_id,
      veiculo_id: parsed.data.veiculo_id ?? null,
      data: parsed.data.data,
      periodo: parsed.data.periodo,
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
      ...(capacidadeExcedida ? { warning: "capacidade_excedida" as const } : {}),
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

  const patch: Record<string, unknown> = {};
  if (parsed.data.veiculo_id !== undefined)
    patch.veiculo_id = parsed.data.veiculo_id ?? null;
  if (parsed.data.data !== undefined) patch.data = parsed.data.data;
  if (parsed.data.periodo !== undefined) patch.periodo = parsed.data.periodo;
  if (parsed.data.descricao !== undefined) patch.descricao = parsed.data.descricao;
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
    return { ok: false, error: "Não é possível excluir agendamento em andamento." };
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
    .select("*, clientes(id), veiculos(id)")
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
        periodo: parsed.data.periodo,
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
```

- [ ] **Step 5.2: Commit**

```bash
git add src/features/agenda/actions.ts
git commit -m "feat(agenda): add server actions (CRUD, status, OS creation)"
```

---

### Task 6: Componentes de UI compartilhados

**Files:**
- Create: `src/features/agenda/components/AgendaStatusBadge.tsx`
- Create: `src/features/agenda/components/OcupacaoIndicator.tsx`
- Create: `src/features/agenda/components/AgendamentoCard.tsx`
- Create: `src/features/agenda/components/MudarStatusAgendamento.tsx`

- [ ] **Step 6.1: AgendaStatusBadge**

```typescript
// src/features/agenda/components/AgendaStatusBadge.tsx

import { Badge } from "@/components/ui/badge";
import { STATUS_COLOR, STATUS_LABEL, type AgendaStatus } from "../types";

interface Props {
  status: AgendaStatus;
}

export function AgendaStatusBadge({ status }: Props) {
  return (
    <Badge variant={STATUS_COLOR[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
```

- [ ] **Step 6.2: OcupacaoIndicator**

```typescript
// src/features/agenda/components/OcupacaoIndicator.tsx

interface Props {
  ocupados: number;
  capacidade: number;
  className?: string;
}

export function OcupacaoIndicator({ ocupados, capacidade, className }: Props) {
  const disponivel = Math.max(0, capacidade - ocupados);
  const percentual = capacidade > 0 ? (ocupados / capacidade) * 100 : 0;
  const cheio = disponivel === 0;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {ocupados}/{capacidade} agendamentos
        </span>
        <span className={cheio ? "font-medium text-destructive" : "text-muted-foreground"}>
          {cheio ? "Lotado" : `${disponivel} vaga${disponivel !== 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            percentual >= 100
              ? "bg-destructive"
              : percentual >= 66
                ? "bg-amber-500"
                : "bg-primary"
          }`}
          style={{ width: `${Math.min(100, percentual)}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 6.3: AgendamentoCard**

```typescript
// src/features/agenda/components/AgendamentoCard.tsx

import Link from "next/link";
import { Car, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AgendamentoComRelacoes } from "../types";
import { AgendaStatusBadge } from "./AgendaStatusBadge";

interface Props {
  agendamento: AgendamentoComRelacoes;
}

export function AgendamentoCard({ agendamento: ag }: Props) {
  return (
    <Link href={`/app/agenda/${ag.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ag.descricao}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {ag.clientes && (
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {ag.clientes.nome}
                  </span>
                )}
                {ag.veiculos && (
                  <span className="flex items-center gap-1">
                    <Car className="size-3" />
                    {ag.veiculos.modelo}
                    {ag.veiculos.placa ? ` · ${ag.veiculos.placa}` : ""}
                  </span>
                )}
              </div>
            </div>
            <AgendaStatusBadge status={ag.status} />
          </div>
          {ag.os_id && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              OS vinculada
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 6.4: MudarStatusAgendamento (client component)**

```typescript
// src/features/agenda/components/MudarStatusAgendamento.tsx

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { mudarStatusAgendamento } from "../actions";
import { getNextStatuses, STATUS_LABEL, type AgendaStatus } from "../types";

interface Props {
  agendamentoId: string;
  statusAtual: AgendaStatus;
}

export function MudarStatusAgendamento({ agendamentoId, statusAtual }: Props) {
  const [isPending, startTransition] = useTransition();
  const proximos = getNextStatuses(statusAtual);

  if (proximos.length === 0) return null;

  function handleMudar(novoStatus: AgendaStatus) {
    startTransition(async () => {
      const result = await mudarStatusAgendamento(agendamentoId, novoStatus);
      if (result.ok) {
        toast.success(`Status: ${STATUS_LABEL[novoStatus]}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {proximos.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={s === "cancelado" || s === "nao_compareceu" ? "destructive" : "default"}
          disabled={isPending}
          onClick={() => handleMudar(s)}
        >
          {STATUS_LABEL[s]}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6.5: Commit**

```bash
git add src/features/agenda/components/AgendaStatusBadge.tsx \
        src/features/agenda/components/OcupacaoIndicator.tsx \
        src/features/agenda/components/AgendamentoCard.tsx \
        src/features/agenda/components/MudarStatusAgendamento.tsx
git commit -m "feat(agenda): add shared UI components"
```

---

### Task 7: PeriodoCard (view da manhã/tarde)

**Files:**
- Create: `src/features/agenda/components/PeriodoCard.tsx`

- [ ] **Step 7.1: Criar PeriodoCard**

```typescript
// src/features/agenda/components/PeriodoCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgendamentoComRelacoes, AgendaPeriodo, OcupacaoDia } from "../types";
import { PERIODO_LABEL } from "../types";
import { AgendamentoCard } from "./AgendamentoCard";
import { OcupacaoIndicator } from "./OcupacaoIndicator";

interface Props {
  periodo: AgendaPeriodo;
  agendamentos: AgendamentoComRelacoes[];
  ocupacao: OcupacaoDia | null;
}

export function PeriodoCard({ periodo, agendamentos, ocupacao }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{PERIODO_LABEL[periodo]}</CardTitle>
        {ocupacao && (
          <OcupacaoIndicator
            ocupados={ocupacao.ocupados}
            capacidade={ocupacao.capacidade_efetiva}
            className="mt-1"
          />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {agendamentos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum agendamento
          </p>
        ) : (
          agendamentos.map((ag) => (
            <AgendamentoCard key={ag.id} agendamento={ag} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
git add src/features/agenda/components/PeriodoCard.tsx
git commit -m "feat(agenda): add PeriodoCard component"
```

---

### Task 8: AgendaHoje (view do dia atual)

**Files:**
- Create: `src/features/agenda/components/AgendaHoje.tsx`

- [ ] **Step 8.1: Criar AgendaHoje**

```typescript
// src/features/agenda/components/AgendaHoje.tsx

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAgendamentosHoje, getOcupacaoDia } from "../queries";
import { PeriodoCard } from "./PeriodoCard";

export async function AgendaHoje() {
  const [agendamentos, ocupacaoManha, ocupacaoTarde] = await Promise.all([
    getAgendamentosHoje(),
    getOcupacaoDia(new Date().toISOString().split("T")[0], "manha"),
    getOcupacaoDia(new Date().toISOString().split("T")[0], "tarde"),
  ]);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold capitalize">{hoje}</h2>
          <p className="text-sm text-muted-foreground">
            {agendamentos.manha.length + agendamentos.tarde.length} agendamento(s)
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/app/agenda/novo">
            <Plus className="size-4" />
            Novo
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PeriodoCard
          periodo="manha"
          agendamentos={agendamentos.manha}
          ocupacao={ocupacaoManha}
        />
        <PeriodoCard
          periodo="tarde"
          agendamentos={agendamentos.tarde}
          ocupacao={ocupacaoTarde}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Commit**

```bash
git add src/features/agenda/components/AgendaHoje.tsx
git commit -m "feat(agenda): add AgendaHoje server component"
```

---

### Task 9: AgendaSemana

**Files:**
- Create: `src/features/agenda/components/AgendaSemana.tsx`

- [ ] **Step 9.1: Criar AgendaSemana**

```typescript
// src/features/agenda/components/AgendaSemana.tsx

import Link from "next/link";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgendamentosSemana } from "../queries";
import { AgendamentoCard } from "./AgendamentoCard";
import { PERIODO_LABEL } from "../types";

interface Props {
  semanaOffset?: number;
}

export async function AgendaSemana({ semanaOffset = 0 }: Props) {
  const base = addWeeks(new Date(), semanaOffset);
  const inicio = startOfWeek(base, { weekStartsOn: 1 });
  const fim = endOfWeek(base, { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: inicio, end: fim });

  const dataInicio = format(inicio, "yyyy-MM-dd");
  const dataFim = format(fim, "yyyy-MM-dd");

  const agendamentos = await getAgendamentosSemana(dataInicio, dataFim);

  const porDia = new Map<string, typeof agendamentos>();
  for (const ag of agendamentos) {
    const lista = porDia.get(ag.data) ?? [];
    lista.push(ag);
    porDia.set(ag.data, lista);
  }

  const prevOffset = semanaOffset - 1;
  const nextOffset = semanaOffset + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(inicio, "d MMM", { locale: ptBR })} –{" "}
          {format(fim, "d MMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/app/agenda/semana?offset=${prevOffset}`}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/agenda/semana">Hoje</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/app/agenda/semana?offset=${nextOffset}`}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {dias.map((dia) => {
          const key = format(dia, "yyyy-MM-dd");
          const ags = porDia.get(key) ?? [];
          const manha = ags.filter((a) => a.periodo === "manha");
          const tarde = ags.filter((a) => a.periodo === "tarde");
          const isHoje = key === format(new Date(), "yyyy-MM-dd");

          return (
            <Card key={key} className={isHoje ? "border-primary" : undefined}>
              <CardHeader className="py-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className={isHoje ? "text-primary font-bold" : ""}>
                    {format(dia, "EEEE, d/MM", { locale: ptBR })}
                  </span>
                  {ags.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {ags.length} agendamento(s)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              {ags.length > 0 && (
                <CardContent className="space-y-3 pt-0">
                  {(["manha", "tarde"] as const).map((p) => {
                    const lista = p === "manha" ? manha : tarde;
                    if (lista.length === 0) return null;
                    return (
                      <div key={p}>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          {PERIODO_LABEL[p]}
                        </p>
                        <div className="space-y-1.5">
                          {lista.map((ag) => (
                            <AgendamentoCard key={ag.id} agendamento={ag} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: Commit**

```bash
git add src/features/agenda/components/AgendaSemana.tsx
git commit -m "feat(agenda): add AgendaSemana server component"
```

---

### Task 10: AgendaMesCalendario

**Files:**
- Create: `src/features/agenda/components/AgendaMesCalendario.tsx`

- [ ] **Step 10.1: Criar AgendaMesCalendario**

```typescript
// src/features/agenda/components/AgendaMesCalendario.tsx

import Link from "next/link";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { getAgendamentosMes } from "../queries";

interface Props {
  ano: number;
  mes: number;
}

export async function AgendaMesCalendario({ ano, mes }: Props) {
  const agendamentos = await getAgendamentosMes(ano, mes);

  // Contar por dia
  const contagem = new Map<string, number>();
  for (const ag of agendamentos) {
    contagem.set(ag.data, (contagem.get(ag.data) ?? 0) + 1);
  }

  const dataBase = new Date(ano, mes - 1, 1);
  const prevDate = subMonths(dataBase, 1);
  const nextDate = addMonths(dataBase, 1);

  const diasComAgendamento = agendamentos.map((ag) => new Date(ag.data + "T12:00:00"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
          {format(dataBase, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/app/agenda/mes?ano=${prevDate.getFullYear()}&mes=${prevDate.getMonth() + 1}`}
            >
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/agenda/mes?ano=${new Date().getFullYear()}&mes=${new Date().getMonth() + 1}`}>
              Hoje
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/app/agenda/mes?ano=${nextDate.getFullYear()}&mes=${nextDate.getMonth() + 1}`}
            >
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Calendar
        mode="multiple"
        selected={diasComAgendamento}
        month={dataBase}
        locale={ptBR}
        className="rounded-md border"
        classNames={{
          day_selected: "bg-primary/20 text-primary-foreground font-medium",
        }}
        components={{
          DayContent: ({ date }) => {
            const key = format(date, "yyyy-MM-dd");
            const count = contagem.get(key);
            return (
              <Link href={`/app/agenda?data=${key}`} className="relative flex h-full w-full items-center justify-center">
                {date.getDate()}
                {count && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
            );
          },
        }}
      />

      <div className="space-y-1">
        <p className="text-sm font-medium">
          Total: {agendamentos.length} agendamento(s)
        </p>
        {Array.from(contagem.entries())
          .sort()
          .map(([data, count]) => (
            <div key={data} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {format(new Date(data + "T12:00:00"), "d/MM (EEE)", { locale: ptBR })}
              </span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 10.2: Commit**

```bash
git add src/features/agenda/components/AgendaMesCalendario.tsx
git commit -m "feat(agenda): add AgendaMesCalendario with calendar component"
```

---

### Task 11: AgendamentoForm (client component)

**Files:**
- Create: `src/features/agenda/components/AgendamentoForm.tsx`

- [ ] **Step 11.1: Criar AgendamentoForm**

```typescript
// src/features/agenda/components/AgendamentoForm.tsx

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAgendamento, updateAgendamento, getOcupacaoAction } from "../actions";
import { PERIODO_LABEL } from "../types";
import type { AgendamentoComRelacoes } from "../types";
import { OcupacaoIndicator } from "./OcupacaoIndicator";
import type { OcupacaoDia } from "../types";

interface ClienteOption {
  id: string;
  nome: string;
}

interface VeiculoOption {
  id: string;
  modelo: string;
  placa: string | null;
  cliente_id: string;
}

interface Props {
  clientes: ClienteOption[];
  veiculos: VeiculoOption[];
  agendamento?: AgendamentoComRelacoes;
  dataInicial?: string;
}

export function AgendamentoForm({ clientes, veiculos, agendamento, dataInicial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clienteId, setClienteId] = useState(agendamento?.cliente_id ?? "");
  const [veiculoId, setVeiculoId] = useState(agendamento?.veiculo_id ?? "");
  const [data, setData] = useState(agendamento?.data ?? dataInicial ?? "");
  const [periodo, setPeriodo] = useState<"manha" | "tarde">(agendamento?.periodo ?? "manha");
  const [descricao, setDescricao] = useState(agendamento?.descricao ?? "");
  const [observacoes, setObservacoes] = useState(agendamento?.observacoes ?? "");
  const [ocupacao, setOcupacao] = useState<OcupacaoDia | null>(null);

  const veiculosCliente = veiculos.filter((v) => v.cliente_id === clienteId);

  // Buscar ocupação ao mudar data/período
  useEffect(() => {
    if (!data || !periodo) return;
    getOcupacaoAction(data, periodo).then((r) => {
      if (r.ok) setOcupacao(r.data);
    });
  }, [data, periodo]);

  // Limpar veículo ao trocar cliente
  useEffect(() => {
    if (agendamento?.cliente_id !== clienteId) setVeiculoId("");
  }, [clienteId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = {
        cliente_id: clienteId,
        veiculo_id: veiculoId || null,
        data,
        periodo,
        descricao,
        observacoes: observacoes || null,
      };

      if (agendamento) {
        const result = await updateAgendamento(agendamento.id, input);
        if (result.ok) {
          toast.success("Agendamento atualizado");
          router.push(`/app/agenda/${agendamento.id}`);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createAgendamento(input);
        if (result.ok) {
          if ("warning" in result.data && result.data.warning === "capacidade_excedida") {
            toast.warning("Agendamento criado, mas período está lotado");
          } else {
            toast.success("Agendamento criado");
          }
          router.push(`/app/agenda/${result.data.id}`);
        } else {
          toast.error(result.error);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cliente">Cliente *</Label>
        <Select
          value={clienteId}
          onValueChange={setClienteId}
          disabled={!!agendamento}
          required
        >
          <SelectTrigger id="cliente">
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="veiculo">Veículo</Label>
        <Select
          value={veiculoId}
          onValueChange={setVeiculoId}
          disabled={!clienteId}
        >
          <SelectTrigger id="veiculo">
            <SelectValue placeholder="Selecione o veículo (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {veiculosCliente.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.modelo}
                {v.placa ? ` — ${v.placa}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="periodo">Período *</Label>
          <Select
            value={periodo}
            onValueChange={(v) => setPeriodo(v as "manha" | "tarde")}
            required
          >
            <SelectTrigger id="periodo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["manha", "tarde"] as const).map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIODO_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {ocupacao && (
        <OcupacaoIndicator
          ocupados={ocupacao.ocupados}
          capacidade={ocupacao.capacidade_efetiva}
        />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição do serviço *</Label>
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Troca de óleo, revisão geral..."
          required
          minLength={2}
          maxLength={500}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Informações adicionais..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Salvando..." : agendamento ? "Salvar" : "Criar agendamento"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 11.2: Commit**

```bash
git add src/features/agenda/components/AgendamentoForm.tsx
git commit -m "feat(agenda): add AgendamentoForm client component"
```

---

### Task 12: CapacidadeConfig (client component)

**Files:**
- Create: `src/features/agenda/components/CapacidadeConfig.tsx`

- [ ] **Step 12.1: Criar CapacidadeConfig**

```typescript
// src/features/agenda/components/CapacidadeConfig.tsx

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsCapacidade } from "../actions";

interface Props {
  capacidadeManha: number;
  capacidadeTarde: number;
}

export function CapacidadeConfig({ capacidadeManha, capacidadeTarde }: Props) {
  const [manha, setManha] = useState(String(capacidadeManha));
  const [tarde, setTarde] = useState(String(capacidadeTarde));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSettingsCapacidade({
        capacidade_manha: parseInt(manha, 10),
        capacidade_tarde: parseInt(tarde, 10),
      });
      if (result.ok) {
        toast.success("Capacidade salva");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cap-manha">Capacidade Manhã</Label>
          <Input
            id="cap-manha"
            type="number"
            min={0}
            max={20}
            value={manha}
            onChange={(e) => setManha(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cap-tarde">Capacidade Tarde</Label>
          <Input
            id="cap-tarde"
            type="number"
            min={0}
            max={20}
            value={tarde}
            onChange={(e) => setTarde(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 12.2: Commit**

```bash
git add src/features/agenda/components/CapacidadeConfig.tsx
git commit -m "feat(agenda): add CapacidadeConfig client component"
```

---

### Task 13: Páginas — Hoje, Semana, Mês

**Files:**
- Create: `src/app/(admin)/app/agenda/page.tsx`
- Create: `src/app/(admin)/app/agenda/semana/page.tsx`
- Create: `src/app/(admin)/app/agenda/mes/page.tsx`

- [ ] **Step 13.1: Página principal (Hoje)**

```typescript
// src/app/(admin)/app/agenda/page.tsx

import Link from "next/link";
import { CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaHoje } from "@/features/agenda/components/AgendaHoje";

interface Props {
  searchParams: Promise<{ data?: string }>;
}

export default async function AgendaPage({ searchParams }: Props) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Agenda</h1>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/agenda/semana">
              <CalendarDays className="size-4" />
              Semana
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/agenda/mes">
              <CalendarRange className="size-4" />
              Mês
            </Link>
          </Button>
        </div>
      </div>
      <AgendaHoje />
    </div>
  );
}
```

- [ ] **Step 13.2: Página semana**

```typescript
// src/app/(admin)/app/agenda/semana/page.tsx

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaSemana } from "@/features/agenda/components/AgendaSemana";

interface Props {
  searchParams: Promise<{ offset?: string }>;
}

export default async function AgendaSemanaPage({ searchParams }: Props) {
  const { offset } = await searchParams;
  const semanaOffset = parseInt(offset ?? "0", 10);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Hoje
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Semana</h1>
      </div>
      <AgendaSemana semanaOffset={semanaOffset} />
    </div>
  );
}
```

- [ ] **Step 13.3: Página mês**

```typescript
// src/app/(admin)/app/agenda/mes/page.tsx

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaMesCalendario } from "@/features/agenda/components/AgendaMesCalendario";

interface Props {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}

export default async function AgendaMesPage({ searchParams }: Props) {
  const { ano: anoStr, mes: mesStr } = await searchParams;
  const hoje = new Date();
  const ano = parseInt(anoStr ?? String(hoje.getFullYear()), 10);
  const mes = parseInt(mesStr ?? String(hoje.getMonth() + 1), 10);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Hoje
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Calendário</h1>
      </div>
      <AgendaMesCalendario ano={ano} mes={mes} />
    </div>
  );
}
```

- [ ] **Step 13.4: Commit**

```bash
git add src/app/(admin)/app/agenda/page.tsx \
        src/app/(admin)/app/agenda/semana/page.tsx \
        src/app/(admin)/app/agenda/mes/page.tsx
git commit -m "feat(agenda): add hoje, semana, mes pages"
```

---

### Task 14: Páginas — Novo, Detalhe, Editar, Configurações

**Files:**
- Create: `src/app/(admin)/app/agenda/novo/page.tsx`
- Create: `src/app/(admin)/app/agenda/[id]/page.tsx`
- Create: `src/app/(admin)/app/agenda/[id]/editar/page.tsx`
- Create: `src/app/(admin)/app/agenda/configuracoes/page.tsx`

- [ ] **Step 14.1: Página novo agendamento**

```typescript
// src/app/(admin)/app/agenda/novo/page.tsx

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AgendamentoForm } from "@/features/agenda/components/AgendamentoForm";
import { createClient } from "@/lib/supabase/server";

interface Props {
  searchParams: Promise<{ data?: string }>;
}

export default async function NovoAgendamentoPage({ searchParams }: Props) {
  const { data: dataInicial } = await searchParams;
  const supabase = await createClient();

  const [{ data: clientes }, { data: veiculos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("veiculos")
      .select("id, modelo, placa, cliente_id")
      .eq("ativo", true)
      .order("modelo"),
  ]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Agenda
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Novo Agendamento</h1>
      </div>
      <AgendamentoForm
        clientes={clientes ?? []}
        veiculos={veiculos ?? []}
        dataInicial={dataInicial}
      />
    </div>
  );
}
```

- [ ] **Step 14.2: Página detalhe do agendamento**

```typescript
// src/app/(admin)/app/agenda/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAgendamento } from "@/features/agenda/queries";
import { AgendaStatusBadge } from "@/features/agenda/components/AgendaStatusBadge";
import { MudarStatusAgendamento } from "@/features/agenda/components/MudarStatusAgendamento";
import { criarOSFromAgendamento } from "@/features/agenda/actions";
import { PERIODO_LABEL } from "@/features/agenda/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AgendamentoDetailPage({ params }: Props) {
  const { id } = await params;
  const agendamento = await getAgendamento(id);

  if (!agendamento) notFound();

  const dataFormatada = format(
    new Date(agendamento.data + "T12:00:00"),
    "EEEE, d 'de' MMMM 'de' yyyy",
    { locale: ptBR },
  );

  const podeEditarStatus =
    agendamento.status !== "concluido" &&
    agendamento.status !== "cancelado" &&
    agendamento.status !== "nao_compareceu";

  const podeEditarCampos =
    agendamento.status === "agendado" || agendamento.status === "confirmado";

  const podeCriarOS =
    agendamento.status === "em_andamento" &&
    !agendamento.os_id &&
    agendamento.veiculo_id;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/agenda">
              <ChevronLeft className="size-4" />
              Agenda
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Agendamento</h1>
        </div>
        {podeEditarCampos && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/agenda/${id}/editar`}>
              <Edit className="size-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{agendamento.descricao}</CardTitle>
            <AgendaStatusBadge status={agendamento.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="capitalize text-muted-foreground">{dataFormatada}</p>
            <p className="font-medium">{PERIODO_LABEL[agendamento.periodo]}</p>
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Cliente: </span>
              <Link
                href={`/app/clientes/${agendamento.cliente_id}`}
                className="font-medium hover:underline"
              >
                {agendamento.clientes?.nome ?? "—"}
              </Link>
            </p>
            {agendamento.veiculos && (
              <p>
                <span className="text-muted-foreground">Veículo: </span>
                <span className="font-medium">
                  {agendamento.veiculos.modelo}
                  {agendamento.veiculos.placa
                    ? ` — ${agendamento.veiculos.placa}`
                    : ""}
                </span>
              </p>
            )}
            {agendamento.observacoes && (
              <p>
                <span className="text-muted-foreground">Obs: </span>
                {agendamento.observacoes}
              </p>
            )}
          </div>

          {agendamento.os_id && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">OS vinculada</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/app/os/${agendamento.os_id}`}>
                    <FileText className="size-4" />
                    Ver OS
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {podeEditarStatus && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Mudar status:</p>
          <MudarStatusAgendamento
            agendamentoId={id}
            statusAtual={agendamento.status}
          />
        </div>
      )}

      {podeCriarOS && (
        <form
          action={async () => {
            "use server";
            await criarOSFromAgendamento(id);
          }}
        >
          <Button type="submit" className="w-full">
            <FileText className="size-4" />
            Criar OS para este agendamento
          </Button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 14.3: Página editar agendamento**

```typescript
// src/app/(admin)/app/agenda/[id]/editar/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAgendamento } from "@/features/agenda/queries";
import { AgendamentoForm } from "@/features/agenda/components/AgendamentoForm";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarAgendamentoPage({ params }: Props) {
  const { id } = await params;
  const [agendamento, supabase] = await Promise.all([
    getAgendamento(id),
    createClient(),
  ]);

  if (!agendamento) notFound();
  if (
    agendamento.status === "concluido" ||
    agendamento.status === "cancelado" ||
    agendamento.status === "nao_compareceu"
  ) {
    notFound();
  }

  const [{ data: clientes }, { data: veiculos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("veiculos")
      .select("id, modelo, placa, cliente_id")
      .eq("ativo", true)
      .order("modelo"),
  ]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/agenda/${id}`}>
            <ChevronLeft className="size-4" />
            Agendamento
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Editar Agendamento</h1>
      </div>
      <AgendamentoForm
        clientes={clientes ?? []}
        veiculos={veiculos ?? []}
        agendamento={agendamento}
      />
    </div>
  );
}
```

- [ ] **Step 14.4: Página configurações**

```typescript
// src/app/(admin)/app/agenda/configuracoes/page.tsx

import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettingsCapacidade } from "@/features/agenda/queries";
import { CapacidadeConfig } from "@/features/agenda/components/CapacidadeConfig";

export default async function AgendaConfiguracoesPage() {
  const capacidade = await getSettingsCapacidade();

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Agenda
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Configurações da Agenda</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" />
            Capacidade padrão
          </CardTitle>
          <CardDescription>
            Número máximo de agendamentos por período. Pode ser sobrescrito por dia específico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CapacidadeConfig
            capacidadeManha={capacidade.manha}
            capacidadeTarde={capacidade.tarde}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 14.5: Commit**

```bash
git add src/app/(admin)/app/agenda/novo/page.tsx \
        "src/app/(admin)/app/agenda/[id]/page.tsx" \
        "src/app/(admin)/app/agenda/[id]/editar/page.tsx" \
        src/app/(admin)/app/agenda/configuracoes/page.tsx
git commit -m "feat(agenda): add novo, detalhe, editar, configuracoes pages"
```

---

### Task 15: Dashboard update + OS vinculada

**Files:**
- Modify: `src/app/(admin)/app/page.tsx`
- Modify: `src/app/(admin)/app/os/[id]/page.tsx`

- [ ] **Step 15.1: Ativar link de Agenda no dashboard**

Abrir `src/app/(admin)/app/page.tsx` e localizar o botão desabilitado da Agenda. Substituir o bloco desabilitado por link ativo:

Buscar por: `Agenda (Sprint 4)` ou o botão/link desabilitado para `/app/agenda`.

Substituir o elemento desabilitado pela versão ativa:

```typescript
// Substituir qualquer botão/link desabilitado de Agenda por:
<Button asChild>
  <Link href="/app/agenda">
    <Calendar className="size-4" />
    Agenda
  </Link>
</Button>
```

Garantir que `Calendar` e `Link` estão importados no arquivo.

- [ ] **Step 15.2: Mostrar agendamento vinculado na página de OS**

Abrir `src/app/(admin)/app/os/[id]/page.tsx`. Após carregar a OS, verificar se `agendamento_id` está preenchido. Se sim, buscar o agendamento e exibir card de link.

Adicionar query no bloco de carregamento de dados:

```typescript
// Adicionar junto com os outros fetches paralelos na página:
const agendamento = data.agendamento_id
  ? await getAgendamento(data.agendamento_id)
  : null;
```

Adicionar import:
```typescript
import { getAgendamento } from "@/features/agenda/queries";
```

Adicionar bloco de exibição após os campos principais da OS (antes dos serviços):

```tsx
{agendamento && (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-muted-foreground">Agendamento origem</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <p className="font-medium">{agendamento.descricao}</p>
          <p className="text-muted-foreground">
            {format(new Date(agendamento.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
            {" · "}
            {PERIODO_LABEL[agendamento.periodo]}
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/app/agenda/${agendamento.id}`}>
            Ver agendamento
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

- [ ] **Step 15.3: Commit**

```bash
git add src/app/(admin)/app/page.tsx "src/app/(admin)/app/os/[id]/page.tsx"
git commit -m "feat(agenda): activate agenda link on dashboard, show agendamento on OS detail"
```

---

### Task 16: Verificação — typecheck + lint + tests + build

- [ ] **Step 16.1: Typecheck**

```bash
pnpm typecheck
```

Esperado: 0 erros.

- [ ] **Step 16.2: Lint**

```bash
pnpm lint
```

Esperado: 0 erros. Se houver warnings de `no-unused-vars` ou similar, corrigir.

- [ ] **Step 16.3: Testes unitários**

```bash
pnpm test src/features/agenda/
```

Esperado: todos PASS.

- [ ] **Step 16.4: Build de produção**

```bash
pnpm build
```

Esperado: build completo sem erros de tipo ou import.

- [ ] **Step 16.5: Commit de fix se necessário**

Se etapas 16.1-16.4 revelarem erros, corrigi-los e commitar:

```bash
git add -p
git commit -m "fix(agenda): typecheck/lint fixes"
```

---

### Task 17: E2E Tests

**Files:**
- Create: `tests/e2e/agenda.spec.ts`

- [ ] **Step 17.1: Verificar que Playwright está configurado**

```bash
ls playwright.config.ts
```

Se não existir, pular E2E e documentar como pendente.

- [ ] **Step 17.2: Criar teste E2E**

```typescript
// tests/e2e/agenda.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Agenda", () => {
  test.beforeEach(async ({ page }) => {
    // Assumir usuário já autenticado via storage state ou login
    await page.goto("/app/agenda");
  });

  test("exibe view do dia com períodos manhã e tarde", async ({ page }) => {
    await expect(page.getByText("Manhã")).toBeVisible();
    await expect(page.getByText("Tarde")).toBeVisible();
  });

  test("navega para criação de agendamento", async ({ page }) => {
    await page.getByRole("link", { name: /novo/i }).click();
    await expect(page).toHaveURL(/\/app\/agenda\/novo/);
    await expect(page.getByLabel("Cliente")).toBeVisible();
  });

  test("navega para view semanal", async ({ page }) => {
    await page.getByRole("link", { name: /semana/i }).click();
    await expect(page).toHaveURL(/\/app\/agenda\/semana/);
  });

  test("navega para view mensal", async ({ page }) => {
    await page.getByRole("link", { name: /mês/i }).click();
    await expect(page).toHaveURL(/\/app\/agenda\/mes/);
  });
});
```

- [ ] **Step 17.3: Commit**

```bash
git add tests/e2e/agenda.spec.ts
git commit -m "test(agenda): add E2E smoke tests"
```

---

### Task 18: Atualizar documentação

**Files:**
- Modify: `docs/00-overview.md`
- Modify: `docs/sprints/sprint-04-agenda.md`

- [ ] **Step 18.1: Marcar Sprint 4 como implementada em docs/00-overview.md**

Localizar tabela de status do roadmap e atualizar:

```markdown
| Sprint 4 | Agenda | 🟢 Implementada (pendente validação Pedro) |
```

- [ ] **Step 18.2: Atualizar checklist em docs/sprints/sprint-04-agenda.md**

Na seção "Progresso" ou equivalente, marcar todos os itens como concluídos.

- [ ] **Step 18.3: Commit final**

```bash
git add docs/00-overview.md docs/sprints/sprint-04-agenda.md
git commit -m "docs: mark Sprint 4 Agenda as implemented"
```

---

### Task 19: Push + PR

- [ ] **Step 19.1: Verificar branch atual**

```bash
git branch --show-current
```

Se estiver em `main`, criar branch:

```bash
git checkout -b sprint-04-agenda
```

- [ ] **Step 19.2: Push da branch**

```bash
git push -u origin sprint-04-agenda
```

- [ ] **Step 19.3: Abrir PR no GitHub**

Acessar https://github.com e criar PR:
- **Base:** `main`
- **Head:** `sprint-04-agenda`
- **Título:** `feat: Sprint 4 — Agenda (agendamentos por período, 3 views, criação de OS)`
- **Corpo:** Lista os recursos implementados, link para sprint doc, nota que Pedro precisa validar no celular antes do merge.

---

## Checklist de auto-revisão (spec coverage)

- [x] Enums `agenda_periodo` (manha/tarde) e `agenda_status` (6 valores) — Task 1
- [x] Tabelas `agendamentos`, `capacidade_overrides`, `settings` — Task 1
- [x] RPC `ocupacao_dia` — Task 1
- [x] FK `ordens_servico.agendamento_id` — Task 1
- [x] State machine completa com `isTransitionAllowed` — Task 2
- [x] Zod schemas validados por TDD — Task 3
- [x] Queries tipadas em server-only — Task 4
- [x] Server actions com ActionResult — Task 5
- [x] `createAgendamento` retorna `warning: capacidade_excedida` sem bloquear — Task 5
- [x] `criarOSFromAgendamento` valida `veiculo_id` obrigatório — Task 5
- [x] View Hoje com PeriodoCard + OcupacaoIndicator — Tasks 7-8
- [x] View Semana com navegação prev/next/hoje — Task 9
- [x] View Mês com Calendar + contador por dia — Task 10
- [x] Form de criação/edição com live occupancy — Task 11
- [x] Configuração de capacidade padrão — Task 12
- [x] 7 páginas cobertas — Tasks 13-14
- [x] Dashboard atualizado (link ativo) — Task 15
- [x] OS detail mostra agendamento origem — Task 15
- [x] typecheck + lint + test + build — Task 16
- [x] E2E smoke tests — Task 17
- [x] Docs atualizados — Task 18
