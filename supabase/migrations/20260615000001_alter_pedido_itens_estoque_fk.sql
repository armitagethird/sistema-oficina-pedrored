-- Sprint 3 — vincular item de pedido a fornecedor com item de estoque
alter table pedido_fornecedor_itens
  add column if not exists item_estoque_id uuid references itens_estoque(id) on delete set null;

create index if not exists idx_pedido_itens_item_estoque
  on pedido_fornecedor_itens(item_estoque_id)
  where item_estoque_id is not null;
