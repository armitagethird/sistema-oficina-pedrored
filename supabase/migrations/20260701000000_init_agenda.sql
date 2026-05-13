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
  select count(*)::integer
    into v_ocupados
    from agendamentos a
   where a.data = p_data
     and a.periodo = p_periodo
     and a.status not in ('cancelado', 'nao_compareceu');

  return query select
    v_cap_padrao,
    v_cap_override,
    v_cap_efetiva,
    v_ocupados,
    greatest(0, v_cap_efetiva - v_ocupados);
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
