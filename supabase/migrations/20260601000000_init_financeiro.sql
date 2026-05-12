-- Sprint 2 — Financeiro
-- Cria: fornecedores, pedidos_fornecedor (+ itens), pagamentos (parcelas), links_afiliado_enviados.
-- Cria: 2 views (contas_a_receber, capital_investido), função marca_pagamentos_atrasados().
-- Depende de: Sprint 0 (clientes, set_atualizado_em) + Sprint 1 (ordens_servico, os_pecas).

-- ===========================================================================
-- Enums
-- ===========================================================================

create type pagamento_metodo as enum ('pix', 'dinheiro', 'cartao', 'transferencia');
create type pagamento_status as enum ('pendente', 'pago', 'atrasado', 'cancelado');
create type pedido_fornecedor_status as enum ('cotacao', 'comprado', 'recebido', 'cancelado');
create type link_afiliado_status as enum ('enviado', 'cliente_comprou', 'comissao_recebida', 'cancelado');

-- ===========================================================================
-- Fornecedores
-- ===========================================================================

create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  cnpj text,
  endereco text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);
create index idx_fornecedores_nome on fornecedores(nome) where deletado_em is null;
create trigger trg_fornecedores_atualizado_em
  before update on fornecedores
  for each row execute function set_atualizado_em();

alter table fornecedores enable row level security;
create policy "fornecedores_authenticated_all" on fornecedores
  for all to authenticated using (true) with check (true);

-- ===========================================================================
-- Pedidos a fornecedor
-- ===========================================================================

create table pedidos_fornecedor (
  id uuid primary key default gen_random_uuid(),
  numero serial unique not null,
  fornecedor_id uuid not null references fornecedores(id) on delete restrict,
  os_id uuid references ordens_servico(id) on delete set null,
  status pedido_fornecedor_status not null default 'cotacao',
  valor_total numeric(12, 2) not null default 0,
  data_compra date,
  data_recebimento date,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_pedidos_fornecedor_status on pedidos_fornecedor(status);
create index idx_pedidos_fornecedor_os on pedidos_fornecedor(os_id);
create index idx_pedidos_fornecedor_fornecedor on pedidos_fornecedor(fornecedor_id);
create trigger trg_pedidos_fornecedor_atualizado_em
  before update on pedidos_fornecedor
  for each row execute function set_atualizado_em();

alter table pedidos_fornecedor enable row level security;
create policy "pedidos_fornecedor_authenticated_all" on pedidos_fornecedor
  for all to authenticated using (true) with check (true);

-- ===========================================================================
-- Itens do pedido
-- ===========================================================================

create table pedido_fornecedor_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos_fornecedor(id) on delete cascade,
  descricao text not null,
  custo_unitario numeric(12, 2) not null check (custo_unitario >= 0),
  quantidade numeric(8, 2) not null default 1 check (quantidade > 0),
  subtotal numeric(12, 2) generated always as (custo_unitario * quantidade) stored,
  os_peca_id uuid references os_pecas(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index idx_pedido_itens_pedido on pedido_fornecedor_itens(pedido_id);
create index idx_pedido_itens_os_peca on pedido_fornecedor_itens(os_peca_id);

alter table pedido_fornecedor_itens enable row level security;
create policy "pedido_itens_authenticated_all" on pedido_fornecedor_itens
  for all to authenticated using (true) with check (true);

-- Recalcula valor_total do pedido a partir dos subtotais dos itens.
create or replace function recalcula_total_pedido_fornecedor(p_pedido_id uuid)
returns void as $$
begin
  update pedidos_fornecedor
    set valor_total = (
      select coalesce(sum(subtotal), 0)
      from pedido_fornecedor_itens
      where pedido_id = p_pedido_id
    )
    where id = p_pedido_id;
end;
$$ language plpgsql;

create or replace function trg_pedido_itens_recalc()
returns trigger as $$
begin
  perform recalcula_total_pedido_fornecedor(coalesce(new.pedido_id, old.pedido_id));
  return null;
end;
$$ language plpgsql;

create trigger trg_pedido_itens_recalc_aiud
  after insert or update or delete on pedido_fornecedor_itens
  for each row execute function trg_pedido_itens_recalc();

-- ===========================================================================
-- Pagamentos (parcelas) do cliente, vinculados a OS
-- ===========================================================================

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete restrict,
  ordem int not null default 1,
  valor numeric(12, 2) not null check (valor > 0),
  metodo pagamento_metodo not null,
  status pagamento_status not null default 'pendente',
  data_prevista date,
  data_paga timestamptz,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_pagamentos_os on pagamentos(os_id);
create index idx_pagamentos_status on pagamentos(status);
create index idx_pagamentos_data_prevista on pagamentos(data_prevista) where status = 'pendente';
create trigger trg_pagamentos_atualizado_em
  before update on pagamentos
  for each row execute function set_atualizado_em();

alter table pagamentos enable row level security;
create policy "pagamentos_authenticated_all" on pagamentos
  for all to authenticated using (true) with check (true);

-- Marca data_paga automaticamente quando status vira 'pago' (e zera se sair de 'pago').
create or replace function trg_pagamentos_marca_data_paga()
returns trigger as $$
begin
  if new.status = 'pago' and (tg_op = 'INSERT' or old.status is null or old.status <> 'pago') then
    new.data_paga := coalesce(new.data_paga, now());
  elsif tg_op = 'UPDATE' and old.status = 'pago' and new.status <> 'pago' then
    new.data_paga := null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_pagamentos_data_paga
  before insert or update on pagamentos
  for each row execute function trg_pagamentos_marca_data_paga();

-- ===========================================================================
-- Links afiliado ML enviados
-- ===========================================================================

create table links_afiliado_enviados (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  os_id uuid references ordens_servico(id) on delete set null,
  link text not null,
  descricao_peca text not null,
  preco_estimado numeric(12, 2),
  comissao_estimada numeric(12, 2),
  comissao_recebida numeric(12, 2),
  status link_afiliado_status not null default 'enviado',
  data_envio timestamptz not null default now(),
  data_compra timestamptz,
  data_comissao timestamptz,
  observacoes text
);
create index idx_links_cliente on links_afiliado_enviados(cliente_id);
create index idx_links_status on links_afiliado_enviados(status);
create index idx_links_os on links_afiliado_enviados(os_id);

alter table links_afiliado_enviados enable row level security;
create policy "links_afiliado_authenticated_all" on links_afiliado_enviados
  for all to authenticated using (true) with check (true);

-- ===========================================================================
-- View: contas a receber (agrupado por cliente)
-- ===========================================================================

create view view_contas_a_receber as
select
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.telefone,
  count(p.id) filter (where p.status in ('pendente', 'atrasado')) as parcelas_em_aberto,
  count(p.id) filter (where p.status = 'atrasado') as parcelas_atrasadas,
  coalesce(sum(p.valor) filter (where p.status in ('pendente', 'atrasado')), 0) as total_em_aberto,
  coalesce(sum(p.valor) filter (where p.status = 'atrasado'), 0) as total_atrasado,
  min(p.data_prevista) filter (where p.status in ('pendente', 'atrasado')) as proxima_data
from clientes c
join ordens_servico os on os.cliente_id = c.id and os.deletado_em is null
join pagamentos p on p.os_id = os.id
where c.deletado_em is null
group by c.id, c.nome, c.telefone
having count(p.id) filter (where p.status in ('pendente', 'atrasado')) > 0;

-- ===========================================================================
-- View: capital investido (pedidos comprados ainda não compensados pelo cliente)
-- ===========================================================================

create view view_capital_investido as
select
  pf.id as pedido_id,
  pf.numero,
  pf.valor_total,
  pf.data_compra,
  f.nome as fornecedor_nome,
  os.id as os_id,
  os.numero as os_numero,
  c.nome as cliente_nome,
  coalesce(
    (select sum(p.valor) from pagamentos p where p.os_id = os.id and p.status = 'pago'),
    0
  ) as cliente_pagou,
  os.total_geral as os_total
from pedidos_fornecedor pf
join fornecedores f on f.id = pf.fornecedor_id
left join ordens_servico os on os.id = pf.os_id
left join clientes c on c.id = os.cliente_id
where pf.status in ('comprado', 'recebido')
  and (
    os.id is null
    or coalesce(
      (select sum(p.valor) from pagamentos p where p.os_id = os.id and p.status = 'pago'),
      0
    ) < os.total_geral
  );

-- ===========================================================================
-- Função: marca pagamentos atrasados (chamada por cron diário)
-- ===========================================================================

create or replace function marca_pagamentos_atrasados()
returns int as $$
declare
  v_count int;
begin
  with atualizados as (
    update pagamentos
      set status = 'atrasado'
      where status = 'pendente'
        and data_prevista is not null
        and data_prevista < current_date
      returning id
  )
  select count(*) into v_count from atualizados;
  return v_count;
end;
$$ language plpgsql;
