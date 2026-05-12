-- Sprint 6 — PedroRed Store (loja pública)
-- Tabelas: produtos_loja, pedidos_loja, itens_pedido_loja
-- Função: gerar_slug_unico
-- Buckets storage: loja-produtos (público) + loja-comprovantes (privado)
-- FK movimentacoes_estoque.pedido_loja_id agora aponta para pedidos_loja

-- ============================================================
-- ENUMS
-- ============================================================

create type produto_status as enum ('ativo', 'inativo', 'esgotado');
create type pedido_loja_status as enum (
  'aguardando_pagamento',
  'pagamento_em_analise',
  'pago',
  'em_separacao',
  'enviado',
  'retirado',
  'cancelado'
);

-- ============================================================
-- PRODUTOS
-- ============================================================

create table produtos_loja (
  id uuid primary key default gen_random_uuid(),
  item_estoque_id uuid references itens_estoque(id) on delete set null,
  titulo text not null,
  slug text not null unique,
  descricao text,
  fotos jsonb not null default '[]'::jsonb,
  preco numeric(12,2) not null check (preco >= 0),
  preco_promocional numeric(12,2),
  estoque_manual int,
  frete_info text,
  status produto_status not null default 'ativo',
  destaque bool not null default false,
  ordem_destaque int default 0,
  metadata jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_produtos_status on produtos_loja(status);
create index idx_produtos_destaque
  on produtos_loja(destaque, ordem_destaque)
  where status = 'ativo' and destaque = true;
create index idx_produtos_slug on produtos_loja(slug);
create index idx_produtos_titulo_tsv
  on produtos_loja using gin (to_tsvector('portuguese', titulo));

create trigger trg_produtos_atualizado_em
  before update on produtos_loja
  for each row execute function set_atualizado_em();

-- ============================================================
-- PEDIDOS
-- ============================================================

create table pedidos_loja (
  id uuid primary key default gen_random_uuid(),
  numero serial unique not null,
  cliente_nome text not null,
  cliente_telefone text not null,
  cliente_email text,
  cliente_endereco jsonb not null,
  valor_subtotal numeric(12,2) not null,
  valor_frete numeric(12,2) not null default 0,
  valor_total numeric(12,2) not null,
  metodo_pagamento text not null default 'pix',
  comprovante_url text,
  status pedido_loja_status not null default 'aguardando_pagamento',
  observacoes_cliente text,
  observacoes_internas text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  pago_em timestamptz,
  enviado_em timestamptz
);

create index idx_pedidos_loja_status on pedidos_loja(status);
create index idx_pedidos_loja_criado on pedidos_loja(criado_em desc);
create index idx_pedidos_loja_telefone on pedidos_loja(cliente_telefone);

create trigger trg_pedidos_loja_atualizado_em
  before update on pedidos_loja
  for each row execute function set_atualizado_em();

-- ============================================================
-- ITENS DO PEDIDO
-- ============================================================

create table itens_pedido_loja (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos_loja(id) on delete cascade,
  produto_id uuid not null references produtos_loja(id) on delete restrict,
  titulo_snapshot text not null,
  preco_unitario numeric(12,2) not null,
  quantidade int not null check (quantidade > 0),
  subtotal numeric(12,2) generated always as (preco_unitario * quantidade) stored,
  criado_em timestamptz not null default now()
);

create index idx_itens_pedido_loja on itens_pedido_loja(pedido_id);

-- ============================================================
-- FK movimentacoes_estoque.pedido_loja_id (Sprint 3 deixou coluna sem FK)
-- ============================================================

alter table movimentacoes_estoque
  add constraint fk_mov_pedido_loja
  foreign key (pedido_loja_id)
  references pedidos_loja(id)
  on delete set null;

-- ============================================================
-- FUNÇÃO: slug único
-- ============================================================

create or replace function gerar_slug_unico(p_titulo text, p_id uuid default null)
returns text as $$
declare
  v_slug text;
  v_count int;
  v_suffix int := 1;
  v_candidato text;
begin
  v_slug := lower(regexp_replace(p_titulo, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' or v_slug is null then v_slug := 'produto'; end if;
  v_candidato := v_slug;

  loop
    select count(*) into v_count from produtos_loja
      where slug = v_candidato and (p_id is null or id <> p_id);
    exit when v_count = 0;
    v_candidato := v_slug || '-' || v_suffix;
    v_suffix := v_suffix + 1;
  end loop;
  return v_candidato;
end;
$$ language plpgsql;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public) values
  ('loja-produtos', 'loja-produtos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('loja-comprovantes', 'loja-comprovantes', false)
  on conflict (id) do nothing;

-- Policies storage
create policy "loja_produtos_select_publico"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'loja-produtos');

create policy "loja_produtos_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'loja-produtos');

create policy "loja_produtos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'loja-produtos');

-- Comprovantes: tudo via server action com service_role (sem policy anon direta)
create policy "loja_comprovantes_auth_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'loja-comprovantes');

-- ============================================================
-- RLS
-- ============================================================

alter table produtos_loja enable row level security;
create policy "produtos_loja_publico_select_ativos"
  on produtos_loja for select
  to anon, authenticated
  using (status = 'ativo');
create policy "produtos_loja_admin_all"
  on produtos_loja for all
  to authenticated
  using (true) with check (true);

alter table pedidos_loja enable row level security;
create policy "pedidos_loja_admin_all"
  on pedidos_loja for all
  to authenticated
  using (true) with check (true);

alter table itens_pedido_loja enable row level security;
create policy "itens_pedido_loja_admin_all"
  on itens_pedido_loja for all
  to authenticated
  using (true) with check (true);
