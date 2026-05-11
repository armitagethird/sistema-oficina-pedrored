-- Sprint 1: Core OS — ordens de serviço, serviços, peças, fotos
-- Idempotente onde possível (Postgres não suporta CREATE TYPE IF NOT EXISTS).

-- Enums (envoltos em DO block para idempotência)
do $$ begin
  create type os_status as enum (
    'aberta', 'em_andamento', 'aguardando_peca', 'pronta', 'entregue', 'cancelada'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type peca_origem as enum (
    'estoque', 'fornecedor', 'mercado_livre_afiliado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type peca_status as enum (
    'pendente', 'comprada', 'recebida', 'aplicada'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type foto_momento as enum (
    'entrada', 'saida', 'durante'
  );
exception when duplicate_object then null; end $$;

-- Ordens de Serviço
create table if not exists ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero serial unique not null,
  cliente_id uuid not null references clientes(id) on delete restrict,
  veiculo_id uuid not null references veiculos(id) on delete restrict,
  status os_status not null default 'aberta',
  descricao_problema text not null,
  km_entrada int,
  km_saida int,
  total_servicos numeric(12,2) not null default 0,
  total_pecas numeric(12,2) not null default 0,
  total_geral numeric(12,2) not null default 0,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  fechado_em timestamptz,
  deletado_em timestamptz
);
create index if not exists idx_os_status on ordens_servico(status) where deletado_em is null;
create index if not exists idx_os_cliente on ordens_servico(cliente_id) where deletado_em is null;
create index if not exists idx_os_veiculo on ordens_servico(veiculo_id) where deletado_em is null;
create index if not exists idx_os_criado on ordens_servico(criado_em desc) where deletado_em is null;

drop trigger if exists trg_os_atualizado_em on ordens_servico;
create trigger trg_os_atualizado_em before update on ordens_servico
  for each row execute function set_atualizado_em();

-- Serviços (mão de obra)
create table if not exists os_servicos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete cascade,
  descricao text not null,
  valor_unitario numeric(12,2) not null check (valor_unitario >= 0),
  quantidade numeric(8,2) not null default 1 check (quantidade > 0),
  subtotal numeric(12,2) generated always as (valor_unitario * quantidade) stored,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists idx_os_servicos_os on os_servicos(os_id);

-- Peças
create table if not exists os_pecas (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete cascade,
  descricao text not null,
  origem peca_origem not null default 'fornecedor',
  custo_unitario numeric(12,2) not null default 0 check (custo_unitario >= 0),
  preco_venda_unitario numeric(12,2) not null check (preco_venda_unitario >= 0),
  quantidade numeric(8,2) not null default 1 check (quantidade > 0),
  subtotal_venda numeric(12,2) generated always as (preco_venda_unitario * quantidade) stored,
  link_ml text,
  fornecedor_nome text,
  status peca_status not null default 'pendente',
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists idx_os_pecas_os on os_pecas(os_id);
create index if not exists idx_os_pecas_status on os_pecas(status);

-- Fotos
create table if not exists os_fotos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete cascade,
  storage_path text not null,
  momento foto_momento not null,
  legenda text,
  criado_em timestamptz not null default now()
);
create index if not exists idx_os_fotos_os on os_fotos(os_id);

-- Função/trigger para recalcular totais da OS quando serviços/peças mudam
create or replace function recalcula_totais_os(p_os_id uuid)
returns void as $$
declare
  v_total_servicos numeric(12,2);
  v_total_pecas numeric(12,2);
begin
  select coalesce(sum(subtotal), 0) into v_total_servicos
    from os_servicos where os_id = p_os_id;
  select coalesce(sum(subtotal_venda), 0) into v_total_pecas
    from os_pecas where os_id = p_os_id;
  update ordens_servico
    set total_servicos = v_total_servicos,
        total_pecas = v_total_pecas,
        total_geral = v_total_servicos + v_total_pecas
    where id = p_os_id;
end;
$$ language plpgsql;

create or replace function trg_recalcula_totais_os()
returns trigger as $$
begin
  perform recalcula_totais_os(coalesce(new.os_id, old.os_id));
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_os_servicos_recalc on os_servicos;
create trigger trg_os_servicos_recalc
  after insert or update or delete on os_servicos
  for each row execute function trg_recalcula_totais_os();

drop trigger if exists trg_os_pecas_recalc on os_pecas;
create trigger trg_os_pecas_recalc
  after insert or update or delete on os_pecas
  for each row execute function trg_recalcula_totais_os();

-- Atualiza fechado_em automaticamente quando status vai para 'entregue'
create or replace function trg_os_marca_fechado_em()
returns trigger as $$
begin
  if new.status = 'entregue' and old.status <> 'entregue' then
    new.fechado_em = now();
  elsif new.status <> 'entregue' then
    new.fechado_em = null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_os_fechado_em on ordens_servico;
create trigger trg_os_fechado_em before update on ordens_servico
  for each row execute function trg_os_marca_fechado_em();

-- RLS
alter table ordens_servico enable row level security;
drop policy if exists "os_authenticated_all" on ordens_servico;
create policy "os_authenticated_all" on ordens_servico
  for all to authenticated using (true) with check (true);

alter table os_servicos enable row level security;
drop policy if exists "os_servicos_authenticated_all" on os_servicos;
create policy "os_servicos_authenticated_all" on os_servicos
  for all to authenticated using (true) with check (true);

alter table os_pecas enable row level security;
drop policy if exists "os_pecas_authenticated_all" on os_pecas;
create policy "os_pecas_authenticated_all" on os_pecas
  for all to authenticated using (true) with check (true);

alter table os_fotos enable row level security;
drop policy if exists "os_fotos_authenticated_all" on os_fotos;
create policy "os_fotos_authenticated_all" on os_fotos
  for all to authenticated using (true) with check (true);

-- Storage bucket os-fotos (privado) + policies authenticated
insert into storage.buckets (id, name, public)
  values ('os-fotos', 'os-fotos', false)
  on conflict (id) do nothing;

drop policy if exists "os_fotos_select_auth" on storage.objects;
create policy "os_fotos_select_auth" on storage.objects
  for select to authenticated
  using (bucket_id = 'os-fotos');

drop policy if exists "os_fotos_insert_auth" on storage.objects;
create policy "os_fotos_insert_auth" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'os-fotos');

drop policy if exists "os_fotos_delete_auth" on storage.objects;
create policy "os_fotos_delete_auth" on storage.objects
  for delete to authenticated
  using (bucket_id = 'os-fotos');
