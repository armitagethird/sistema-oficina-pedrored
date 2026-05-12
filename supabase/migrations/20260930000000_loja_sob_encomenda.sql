-- Suplemento Sprint 6 — flag "somente sob encomenda" + auto-esgotado
--
-- 1. Adiciona coluna produtos_loja.somente_sob_encomenda
-- 2. Constraint: produto sob encomenda não pode estar vinculado a itens_estoque
-- 3. Trigger em itens_estoque: alterna produtos_loja entre 'ativo' e 'esgotado'
--    quando quantidade_atual cruza zero. Não mexe em 'inativo' (controle manual).

-- ============================================================
-- COLUNA + CHECK
-- ============================================================

alter table produtos_loja
  add column somente_sob_encomenda boolean not null default false;

alter table produtos_loja
  add constraint produtos_loja_sob_encomenda_sem_estoque
  check (somente_sob_encomenda = false or item_estoque_id is null);

-- ============================================================
-- TRIGGER: auto-esgotado quando saldo de itens_estoque cruza zero
-- ============================================================

create or replace function trg_itens_estoque_sync_loja_status()
returns trigger as $$
begin
  -- Só age quando quantidade_atual realmente mudou
  if tg_op = 'UPDATE' and new.quantidade_atual is not distinct from old.quantidade_atual then
    return new;
  end if;

  -- Saldo zerou ou ficou negativo → esgotar produtos ativos vinculados
  if new.quantidade_atual <= 0 then
    update produtos_loja
      set status = 'esgotado'
      where item_estoque_id = new.id
        and status = 'ativo';
  else
    -- Saldo voltou positivo → reativar produtos esgotados vinculados
    update produtos_loja
      set status = 'ativo'
      where item_estoque_id = new.id
        and status = 'esgotado';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_itens_estoque_loja_status
  after update of quantidade_atual on itens_estoque
  for each row execute function trg_itens_estoque_sync_loja_status();
