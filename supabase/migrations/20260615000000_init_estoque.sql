-- Sprint 3 — Estoque
-- Tabelas: categorias_estoque, itens_estoque, movimentacoes_estoque
-- Função aplicar_movimentacao_estoque + trigger trg_os_pecas_estoque
-- View view_itens_abaixo_minimo + RLS

-- ============================================================
-- ENUM
-- ============================================================

create type movimentacao_tipo as enum (
  'entrada',
  'saida_os',
  'saida_loja',
  'ajuste'
);

-- ============================================================
-- CATEGORIAS
-- ============================================================

create table categorias_estoque (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

insert into categorias_estoque (nome, ordem) values
  ('Óleo', 1),
  ('Filtro', 2),
  ('Pneu', 3),
  ('Roda', 4),
  ('Fluido', 5),
  ('Lâmpada', 6),
  ('Palheta', 7),
  ('Outro', 99);

-- ============================================================
-- ITENS DE ESTOQUE
-- ============================================================

create table itens_estoque (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias_estoque(id) on delete restrict,
  descricao text not null,
  sku text,
  unidade text not null default 'un',
  quantidade_atual numeric(12,3) not null default 0,
  custo_medio numeric(12,2) not null default 0,
  preco_venda numeric(12,2) not null default 0,
  alerta_minimo numeric(12,3) not null default 0,
  ativo bool not null default true,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);

create index idx_itens_categoria on itens_estoque(categoria_id) where deletado_em is null;
create index idx_itens_descricao on itens_estoque(descricao) where deletado_em is null;
create index idx_itens_sku on itens_estoque(sku) where sku is not null and deletado_em is null;

create trigger trg_itens_estoque_atualizado_em
  before update on itens_estoque
  for each row execute function set_atualizado_em();

-- ============================================================
-- MOVIMENTAÇÕES
-- ============================================================

create table movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references itens_estoque(id) on delete restrict,
  tipo movimentacao_tipo not null,
  quantidade numeric(12,3) not null check (quantidade > 0),
  custo_unitario numeric(12,2),
  os_id uuid references ordens_servico(id) on delete set null,
  os_peca_id uuid references os_pecas(id) on delete set null,
  pedido_loja_id uuid,  -- FK adicionada na Sprint 6
  pedido_fornecedor_id uuid references pedidos_fornecedor(id) on delete set null,
  ajuste_motivo text,
  saldo_apos numeric(12,3) not null,
  criado_em timestamptz not null default now()
);

create index idx_mov_item on movimentacoes_estoque(item_id);
create index idx_mov_tipo on movimentacoes_estoque(tipo);
create index idx_mov_criado on movimentacoes_estoque(criado_em desc);
create index idx_mov_os on movimentacoes_estoque(os_id) where os_id is not null;
create index idx_mov_pedido_fornecedor on movimentacoes_estoque(pedido_fornecedor_id) where pedido_fornecedor_id is not null;

-- ============================================================
-- FUNÇÃO: aplicar movimentação (atualiza saldo + custo médio + log)
-- ============================================================

create or replace function aplicar_movimentacao_estoque(
  p_item_id uuid,
  p_tipo movimentacao_tipo,
  p_quantidade numeric,
  p_custo_unitario numeric default null,
  p_os_id uuid default null,
  p_os_peca_id uuid default null,
  p_pedido_loja_id uuid default null,
  p_pedido_fornecedor_id uuid default null,
  p_ajuste_motivo text default null
)
returns uuid as $$
declare
  v_item itens_estoque%rowtype;
  v_novo_saldo numeric(12,3);
  v_novo_custo_medio numeric(12,2);
  v_mov_id uuid;
begin
  select * into v_item from itens_estoque where id = p_item_id for update;
  if not found then
    raise exception 'Item de estoque % não encontrado', p_item_id;
  end if;
  if v_item.deletado_em is not null then
    raise exception 'Item de estoque % está deletado', p_item_id;
  end if;

  if p_tipo = 'entrada' then
    v_novo_saldo := v_item.quantidade_atual + p_quantidade;
    if p_custo_unitario is null then
      raise exception 'custo_unitario obrigatório em entrada';
    end if;
    -- custo médio ponderado
    if v_item.quantidade_atual + p_quantidade > 0 then
      v_novo_custo_medio :=
        ((v_item.quantidade_atual * v_item.custo_medio) + (p_quantidade * p_custo_unitario))
        / (v_item.quantidade_atual + p_quantidade);
    else
      v_novo_custo_medio := p_custo_unitario;
    end if;
  elsif p_tipo in ('saida_os', 'saida_loja') then
    v_novo_saldo := v_item.quantidade_atual - p_quantidade;
    if v_novo_saldo < 0 then
      raise exception 'Estoque insuficiente para %: tem %, tentou tirar %',
        v_item.descricao, v_item.quantidade_atual, p_quantidade;
    end if;
    v_novo_custo_medio := v_item.custo_medio;
  elsif p_tipo = 'ajuste' then
    if p_ajuste_motivo is null then
      raise exception 'ajuste_motivo obrigatório em ajuste';
    end if;
    v_novo_saldo := v_item.quantidade_atual + p_quantidade;
    v_novo_custo_medio := v_item.custo_medio;
  else
    raise exception 'Tipo % não suportado', p_tipo;
  end if;

  update itens_estoque
    set quantidade_atual = v_novo_saldo,
        custo_medio = v_novo_custo_medio
    where id = p_item_id;

  insert into movimentacoes_estoque (
    item_id, tipo, quantidade, custo_unitario,
    os_id, os_peca_id, pedido_loja_id, pedido_fornecedor_id,
    ajuste_motivo, saldo_apos
  ) values (
    p_item_id, p_tipo, p_quantidade, p_custo_unitario,
    p_os_id, p_os_peca_id, p_pedido_loja_id, p_pedido_fornecedor_id,
    p_ajuste_motivo, v_novo_saldo
  ) returning id into v_mov_id;

  return v_mov_id;
end;
$$ language plpgsql;

-- ============================================================
-- FK em os_pecas (Sprint 3 estende Sprint 1)
-- ============================================================

alter table os_pecas
  add column item_estoque_id uuid references itens_estoque(id) on delete set null;

create index idx_os_pecas_item_estoque on os_pecas(item_estoque_id) where item_estoque_id is not null;

-- ============================================================
-- TRIGGER: baixa automática quando os_pecas origem='estoque'
-- ============================================================

create or replace function trg_os_pecas_baixa_estoque()
returns trigger as $$
declare
  v_old_qtd numeric;
begin
  -- INSERT
  if (tg_op = 'INSERT') then
    if new.origem = 'estoque' and new.item_estoque_id is not null then
      perform aplicar_movimentacao_estoque(
        new.item_estoque_id, 'saida_os'::movimentacao_tipo, new.quantidade,
        null, new.os_id, new.id, null, null, null
      );
    end if;
    return new;
  end if;

  -- UPDATE
  if (tg_op = 'UPDATE') then
    -- se mudou item, quantidade ou origem: estorna antigo e aplica novo
    if (old.origem = 'estoque' and old.item_estoque_id is not null) then
      v_old_qtd := old.quantidade;
      perform aplicar_movimentacao_estoque(
        old.item_estoque_id, 'entrada'::movimentacao_tipo, v_old_qtd, old.custo_unitario,
        null, null, null, null, null
      );
    end if;
    if (new.origem = 'estoque' and new.item_estoque_id is not null) then
      perform aplicar_movimentacao_estoque(
        new.item_estoque_id, 'saida_os'::movimentacao_tipo, new.quantidade,
        null, new.os_id, new.id, null, null, null
      );
    end if;
    return new;
  end if;

  -- DELETE
  if (tg_op = 'DELETE') then
    if old.origem = 'estoque' and old.item_estoque_id is not null then
      perform aplicar_movimentacao_estoque(
        old.item_estoque_id, 'entrada'::movimentacao_tipo, old.quantidade, old.custo_unitario,
        null, null, null, null, null
      );
    end if;
    return old;
  end if;

  return null;
end;
$$ language plpgsql;

create trigger trg_os_pecas_estoque
  after insert or update or delete on os_pecas
  for each row execute function trg_os_pecas_baixa_estoque();

-- ============================================================
-- VIEW: itens abaixo do mínimo
-- ============================================================

create view view_itens_abaixo_minimo as
select * from itens_estoque
where deletado_em is null
  and ativo = true
  and quantidade_atual <= alerta_minimo;

-- ============================================================
-- RLS
-- ============================================================

alter table categorias_estoque enable row level security;
create policy "categorias_authenticated_all" on categorias_estoque
  for all to authenticated using (true) with check (true);

alter table itens_estoque enable row level security;
create policy "itens_authenticated_all" on itens_estoque
  for all to authenticated using (true) with check (true);

alter table movimentacoes_estoque enable row level security;
create policy "movimentacoes_authenticated_all" on movimentacoes_estoque
  for all to authenticated using (true) with check (true);
