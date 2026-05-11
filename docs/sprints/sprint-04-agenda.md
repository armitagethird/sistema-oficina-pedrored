# Sprint 4 — Agenda (dia + janela manhã/tarde)

> **Self-contained.** Leia também `CLAUDE.md`, `docs/00-overview.md`, `docs/architecture/{stack,data-model}.md`. Sprints 0–3 ✅.

## Status

⚪ Pendente.

## Contexto

Pedro tem demanda volátil — 1 carro num dia, 6 no outro. Hoje agenda manualmente via WhatsApp e cabeça. Sprints anteriores entregaram OS + estoque + financeiro, mas sem agenda Pedro continua se perdendo no "quem vem quando".

Esta sprint entrega: cadastro de agendamentos por **dia + janela manhã/tarde** (sem slots por hora — combina com fluxo real), capacidade configurável por período, visão "fila do dia" (agenda de hoje + amanhã), e vínculo opcional agendamento → OS (quando o carro chega).

## Pré-requisitos

- Sprint 1 ✅ — clientes/veículos existem.
- Sprint 5 (WhatsApp) **não** é pré-requisito; lembretes automáticos vão usar agendamentos como fonte depois.

## Objetivo

Pedro consegue:

1. Marcar agendamento: cliente + (veículo opcional) + data + período (manhã/tarde) + descrição do serviço esperado.
2. Configurar capacidade: quantos carros aceita por período (default 3).
3. Ver agenda em 3 visualizações:
   - **Hoje** (default home da agenda — cards manhã/tarde com cards dos carros)
   - **Próximos 7 dias** (lista cronológica)
   - **Mês** (calendário com pontos coloridos indicando ocupação)
4. Mudar status do agendamento: agendado → confirmado → em_andamento → concluído | cancelado | nao_compareceu.
5. Ao iniciar atendimento (status em_andamento), criar OS automaticamente do agendamento (com cliente+veículo já preenchidos).
6. Receber alerta quando tenta agendar acima da capacidade do período (mas pode forçar).

## Decisões já tomadas

- Sem slots por hora — só `manha` ou `tarde`.
- Capacidade default 3 por período. Configurável por dia específico (override) ou global (settings).
- Pode forçar agendamento acima da capacidade (mostra warning, não bloqueia).
- OS criada a partir do agendamento mantém vínculo (`agendamentos.os_id`).
- Cancelamento e "não compareceu" são status terminais distintos pra métricas.

## Stack desta sprint

```bash
pnpm add date-fns                 # já instalado
# Calendário: shadcn já tem (Sprint 0)
```

Sem novas deps grandes.

## Schema delta — `supabase/migrations/20260701000000_init_agenda.sql`

```sql
-- Enums
create type agenda_periodo as enum ('manha', 'tarde');
create type agenda_status as enum (
  'agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu'
);

-- Agendamentos
create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  veiculo_id uuid references veiculos(id) on delete set null,
  os_id uuid references ordens_servico(id) on delete set null,
  data date not null,
  periodo agenda_periodo not null,
  descricao_servico text not null,
  status agenda_status not null default 'agendado',
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_agend_data_periodo on agendamentos(data, periodo);
create index idx_agend_status on agendamentos(status);
create index idx_agend_cliente on agendamentos(cliente_id);
create trigger trg_agendamentos_atualizado_em before update on agendamentos
  for each row execute function set_atualizado_em();

-- Capacidade override por dia/período
create table capacidade_overrides (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  periodo agenda_periodo not null,
  capacidade_max int not null check (capacidade_max >= 0),
  criado_em timestamptz not null default now(),
  unique (data, periodo)
);

-- Settings global (key-value simples)
create table settings (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);
insert into settings (chave, valor) values
  ('agenda_capacidade_manha', '3'::jsonb),
  ('agenda_capacidade_tarde', '3'::jsonb);

create trigger trg_settings_atualizado_em before update on settings
  for each row execute function set_atualizado_em();

-- View ocupação por dia/período (próximos 60 dias)
create or replace function ocupacao_dia(p_data date, p_periodo agenda_periodo)
returns table (
  data date,
  periodo agenda_periodo,
  ocupados int,
  capacidade int,
  livre int
) as $$
declare
  v_cap int;
begin
  -- override tem precedência
  select capacidade_max into v_cap
    from capacidade_overrides
    where data = p_data and periodo = p_periodo;
  if v_cap is null then
    select (valor#>>'{}')::int into v_cap
      from settings
      where chave = case p_periodo
        when 'manha' then 'agenda_capacidade_manha'
        when 'tarde' then 'agenda_capacidade_tarde'
      end;
  end if;
  return query
  select
    p_data,
    p_periodo,
    (select count(*)::int
       from agendamentos
       where data = p_data
         and periodo = p_periodo
         and status not in ('cancelado','nao_compareceu')) as ocupados,
    coalesce(v_cap, 3) as capacidade,
    coalesce(v_cap, 3) - (select count(*)::int
       from agendamentos
       where data = p_data
         and periodo = p_periodo
         and status not in ('cancelado','nao_compareceu')) as livre;
end;
$$ language plpgsql;

-- RLS
alter table agendamentos enable row level security;
create policy "agend_authenticated_all" on agendamentos
  for all to authenticated using (true) with check (true);

alter table capacidade_overrides enable row level security;
create policy "cap_overrides_authenticated_all" on capacidade_overrides
  for all to authenticated using (true) with check (true);

alter table settings enable row level security;
create policy "settings_authenticated_all" on settings
  for all to authenticated using (true) with check (true);
```

## Estrutura — delta

```
src/
├── app/(admin)/app/
│   └── agenda/
│       ├── page.tsx                           # default: hoje
│       ├── semana/page.tsx                    # próximos 7 dias
│       ├── mes/page.tsx                       # calendário com pontos
│       ├── novo/page.tsx                      # form criar agendamento
│       ├── [id]/
│       │   ├── page.tsx                       # detalhe + actions
│       │   └── editar/page.tsx
│       └── configuracoes/page.tsx             # capacidade default + overrides
├── features/agenda/
│   ├── actions.ts                             # createAgendamento, mudarStatus, criarOSFromAgendamento,
│   │                                          # setCapacidadeOverride, setCapacidadeDefault
│   ├── queries.ts                             # listAgendamentosDia, listAgendamentosSemana,
│   │                                          # listAgendamentosMes, ocupacaoPeriodo
│   ├── schemas.ts, types.ts
│   └── components/
│       ├── agenda-status-badge.tsx
│       ├── periodo-card.tsx                   # card grande manhã/tarde com lista de carros
│       ├── agendamento-card.tsx               # card individual de agendamento
│       ├── agenda-hoje.tsx                    # composição da home agenda
│       ├── agenda-semana.tsx
│       ├── agenda-mes-calendario.tsx          # shadcn Calendar com renderização customizada
│       ├── agendamento-form.tsx               # com warning capacidade excedida
│       ├── capacidade-config.tsx
│       └── ocupacao-indicator.tsx             # X/Y vagas
```

## Tasks ordenadas

### Schema

1. Migration `20260701000000_init_agenda.sql`.
2. `supabase db push`. `pnpm db:gen`.

### Feature `agenda`

3. Schemas zod (validação data >= hoje, descrição obrigatória, status válido).
4. Queries:
   - `listAgendamentosDia(data)` — retorna agrupado por período
   - `listAgendamentosSemana(dataInicio)` — próximos 7 dias agrupados por dia
   - `listAgendamentosMes(ano, mes)` — todos do mês com contadores por dia
   - `ocupacaoPeriodo(data, periodo)` — chama RPC `ocupacao_dia`
5. Actions:
   - `createAgendamento({ clienteId, veiculoId?, data, periodo, descricaoServico, observacoes? })` — verifica capacidade, retorna `{ ok, warning?: 'capacidade_excedida' }` (frontend confirma se quer forçar)
   - `updateAgendamento(id, partial)`
   - `mudarStatus(id, novoStatus)` — valida transição; quando `em_andamento` chama `criarOSFromAgendamento`
   - `criarOSFromAgendamento(agendamentoId)` — cria OS com dados do agendamento, atualiza `agendamentos.os_id`, status → `em_andamento`
   - `setCapacidadeDefault(periodo, valor)` — atualiza `settings`
   - `setCapacidadeOverride(data, periodo, valor)` — upsert em `capacidade_overrides`
6. Componentes:
   - `AgendaStatusBadge` (cores: agendado=azul, confirmado=verde, em_andamento=amarelo, concluido=cinza, cancelado=vermelho, nao_compareceu=laranja)
   - `OcupacaoIndicator` — mostra "2 / 3 vagas"
   - `PeriodoCard` — card grande com header "Manhã" / "Tarde" + ocupação + lista de cards menores
   - `AgendamentoCard` — cliente + veículo + descrição + badge status + ações rápidas (mudar status)
   - `AgendaHoje` — usa `PeriodoCard × 2`. Header com data + botão "Próximo dia"
   - `AgendaSemana` — lista cronológica, cada dia agrupa periodos
   - `AgendaMesCalendario` — shadcn `Calendar` com `modifiers` colorindo dias por ocupação (verde/amarelo/vermelho)
   - `AgendamentoForm` — RHF + zod. Quando user escolhe data+período, faz fetch ocupação ao vivo. Se ocupados >= capacidade, mostra warning amarelo "Período cheio (3/3). Continuar?"
   - `CapacidadeConfig` — tela settings: input default manhã + input default tarde + lista overrides com data picker
7. Páginas:
   - `/app/agenda` (= `AgendaHoje`)
   - `/app/agenda/semana`, `/app/agenda/mes`
   - `/app/agenda/novo`
   - `/app/agenda/[id]` (detalhe — mostra timeline status, vínculo OS se houver)
   - `/app/agenda/configuracoes`

### Bottom-nav

8. Conectar item "Agenda" do bottom-nav.

### Dashboard

9. Adicionar card "Hoje" no dashboard mostrando ocupação manhã/tarde + lista compacta dos próximos.

### Vínculo com OS (Sprint 1)

10. No detalhe de OS, se `agendamento_id` foi preenchido (a partir desta sprint), mostrar link "Veio de agendamento #X".
11. Adicionar coluna `agendamento_id` em `ordens_servico` via migration adicional desta sprint:
    ```sql
    alter table ordens_servico add column agendamento_id uuid references agendamentos(id) on delete set null;
    ```

### Testes

12. Vitest:
    - Schema agendamento (data passada rejeita)
    - Função `ocupacao_dia` (overrides têm precedência sobre default)
    - State machine status (transições válidas)
13. Playwright:
    - Marcar agendamento amanhã manhã
    - Tentar marcar 4º agendamento (capacidade 3) → warning aparece, força → cria
    - Iniciar atendimento → OS criada com cliente+veículo automaticamente
    - Cancelar agendamento → status atualiza, vaga libera

### Documentação

14. Atualizar `data-model.md`.
15. Atualizar `00-overview.md` Sprint 4 → 🟢.

## Critical files

- `supabase/migrations/20260701000000_init_agenda.sql`
- `src/features/agenda/**`
- Atualizações: `src/features/ordens/queries.ts` (incluir `agendamento_id`)
- Atualizações: `src/components/shell/bottom-nav.tsx`

## Skills

- `superpowers:writing-plans`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`

## Verificação

### Automatizada

- [ ] typecheck/lint/test/e2e/build verdes
- [ ] Migration aplica
- [ ] RPC `ocupacao_dia` retorna corretamente

### Manual (dev)

- [ ] Marcar 3 agendamentos manhã hoje → 4º mostra warning
- [ ] Override capacidade hoje manhã = 5 → marca 4º sem warning
- [ ] Cancelar agendamento → ocupação cai
- [ ] Iniciar atendimento → OS criada, status mudou
- [ ] Calendário mês mostra cores certas

### Manual (Pedro)

- [ ] Marca clientes reais pra próximos dias
- [ ] No dia, vê agenda de hoje no celular
- [ ] Inicia atendimento → cria OS direto
- [ ] Confirma "consigo me organizar" via WhatsApp

## Definition of Done

1. Verificação completa
2. `00-overview.md` Sprint 4 = ✅
3. PR mergeado, deploy verde
4. Pedro validou

## Fora de escopo

- Slots por hora
- Lembretes WhatsApp automáticos (Sprint 5)
- Booking público (cliente marcando direto sem Pedro) — futuro
- Multi-mecânico / agenda por funcionário
- Sincronização Google Calendar
- Bloqueio "não atende" por feriado/folga (pode entrar via override capacidade=0)

## Bloqueios

(adicione)

## Progresso

(atualize)

## Referências

- shadcn Calendar: https://ui.shadcn.com/docs/components/calendar
- date-fns: https://date-fns.org
