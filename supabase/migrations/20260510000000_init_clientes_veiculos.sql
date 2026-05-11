-- Sprint 0: schema base de clientes, veículos e catálogo VW
-- Idempotência: cada CREATE usa IF NOT EXISTS quando suportado.

-- Trigger genérico de atualizado_em
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

-- Catálogo VW (seed em migration separada)
create table if not exists vw_modelos (
  id uuid primary key default gen_random_uuid(),
  modelo text not null,
  motor text not null,
  combustivel text not null default 'flex',
  ano_inicio int,
  ano_fim int,
  criado_em timestamptz not null default now(),
  unique (modelo, motor)
);
create index if not exists idx_vw_modelos_modelo on vw_modelos(modelo);

-- Clientes
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  cpf text,
  endereco jsonb,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);
create index if not exists idx_clientes_nome on clientes(nome) where deletado_em is null;
create index if not exists idx_clientes_telefone on clientes(telefone) where deletado_em is null;

drop trigger if exists trg_clientes_atualizado_em on clientes;
create trigger trg_clientes_atualizado_em before update on clientes
  for each row execute function set_atualizado_em();

-- Veículos
create table if not exists veiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  modelo_id uuid references vw_modelos(id) on delete set null,
  modelo_custom text,
  motor text,
  ano int,
  placa text,
  cor text,
  km_atual int default 0,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz,
  check (modelo_id is not null or modelo_custom is not null)
);
create index if not exists idx_veiculos_cliente on veiculos(cliente_id) where deletado_em is null;
create index if not exists idx_veiculos_placa on veiculos(placa) where deletado_em is null;

drop trigger if exists trg_veiculos_atualizado_em on veiculos;
create trigger trg_veiculos_atualizado_em before update on veiculos
  for each row execute function set_atualizado_em();

-- RLS — single-user authenticated
alter table vw_modelos enable row level security;
drop policy if exists "vw_modelos_authenticated_all" on vw_modelos;
create policy "vw_modelos_authenticated_all" on vw_modelos
  for all to authenticated using (true) with check (true);

alter table clientes enable row level security;
drop policy if exists "clientes_authenticated_all" on clientes;
create policy "clientes_authenticated_all" on clientes
  for all to authenticated using (true) with check (true);

alter table veiculos enable row level security;
drop policy if exists "veiculos_authenticated_all" on veiculos;
create policy "veiculos_authenticated_all" on veiculos
  for all to authenticated using (true) with check (true);
