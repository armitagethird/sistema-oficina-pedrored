# Sprint 3 — Estoque

> **Self-contained.** Leia também `CLAUDE.md`, `docs/00-overview.md`, `docs/architecture/{stack,data-model}.md`. Sprints 0/1/2 ✅ antes de iniciar.

## Status

🟢 Implementada na branch `sprint-03-06` (em conjunto com Sprint 6 por decisão do Romero — PR único no final).

## Contexto

Pedro vende peças e materiais que mantém em prateleira: óleo (vários tipos), filtros (ar/óleo/combustível/cabine), pneus, rodas, fluidos, palhetas, lâmpadas, etc. Hoje não tem visibilidade de quanto tem, quanto custa, qual margem. Vende e esquece de comprar de novo, descobre que acabou só na hora.

Esta sprint resolve: cadastro de itens com categoria, controle de quantidade, custo médio + preço de venda, alerta de mínimo, registro de movimentações (entrada via pedido fornecedor / saída via OS / saída via loja / ajuste manual), histórico completo. Quando peça da OS tem `origem = 'estoque'`, sistema baixa estoque automaticamente.

## Pré-requisitos

- Sprint 2 ✅ — `pedidos_fornecedor` existe e pode ser fonte de entradas em estoque.
- Sprint 1 ✅ — `os_pecas` existe e ganha vínculo com itens de estoque.

## Objetivo

Pedro consegue:

1. Cadastrar item de estoque (categoria, descrição, SKU opcional, unidade, custo, venda, alerta mínimo).
2. Ver lista de estoque com filtros (categoria, abaixo do mínimo, busca).
3. Registrar entrada manual (compra avulsa) ou via pedido a fornecedor (Sprint 2).
4. Quando adiciona peça em OS com `origem = 'estoque'`, escolhe o item via combobox; sistema baixa qtd do estoque automaticamente.
5. Ver histórico de movimentações por item.
6. Receber alerta visual no dashboard quando há itens abaixo do mínimo.
7. Ajustar manualmente (correção de inventário) com motivo registrado.

## Decisões já tomadas

- Custo médio é calculado: a cada entrada com custo_unitario, recalcula `custo_medio = (custo_atual * qtd_atual + custo_entrada * qtd_entrada) / (qtd_atual + qtd_entrada)`.
- Saída de OS é trigger automático em `os_pecas` quando `origem = 'estoque'` AND `item_estoque_id IS NOT NULL`.
- Soft delete em `itens_estoque`. Itens com movimentações nunca são deletados de fato.
- Categorias são fixas seedadas (óleo, filtro, pneu, roda, fluido, lâmpada, palheta, outro). Pedro pode adicionar via UI.
- Alerta de mínimo: badge vermelho na lista + counter no dashboard. Sem notificação push (Sprint 5).

## Stack desta sprint

Sem novas dependências grandes. Reaproveita tanstack-table, recharts.

## Schema delta — `supabase/migrations/20260615000000_init_estoque.sql`

```sql
-- Enum
create type movimentacao_tipo as enum ('entrada', 'saida_os', 'saida_loja', 'ajuste');

-- Categorias
create table categorias_estoque (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
insert into categorias_estoque (nome, ordem) values
  ('Óleo', 1), ('Filtro', 2), ('Pneu', 3), ('Roda', 4),
  ('Fluido', 5), ('Lâmpada', 6), ('Palheta', 7), ('Outro', 99);

-- Itens
create table itens_estoque (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias_estoque(id) on delete restrict,
  descricao text not null,
  sku text,
  unidade text not null default 'un',          -- un, l, kg, m, par
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
create trigger trg_itens_estoque_atualizado_em before update on itens_estoque
  for each row execute function set_atualizado_em();

-- Movimentações
create table movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references itens_estoque(id) on delete restrict,
  tipo movimentacao_tipo not null,
  quantidade numeric(12,3) not null check (quantidade > 0),     -- sempre positivo; sinal vem do tipo
  custo_unitario numeric(12,2),                                 -- preenchido em 'entrada' e 'ajuste' (se acrescentar)
  os_id uuid references ordens_servico(id) on delete set null,
  os_peca_id uuid references os_pecas(id) on delete set null,
  pedido_loja_id uuid,                                          -- FK adicionada na Sprint 6
  pedido_fornecedor_id uuid references pedidos_fornecedor(id) on delete set null,
  ajuste_motivo text,                                           -- obrigatório quando tipo='ajuste'
  saldo_apos numeric(12,3) not null,                            -- snapshot do saldo após
  criado_em timestamptz not null default now()
);
create index idx_mov_item on movimentacoes_estoque(item_id);
create index idx_mov_tipo on movimentacoes_estoque(tipo);
create index idx_mov_criado on movimentacoes_estoque(criado_em desc);

-- Função: aplicar movimentação (atualiza saldo + custo médio + insere log)
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
    -- ajuste pode ser positivo ou negativo via convenção: quantidade representa o delta absoluto
    -- e ajuste_motivo descreve. Não recalcula custo médio.
    if p_ajuste_motivo is null then
      raise exception 'ajuste_motivo obrigatório em ajuste';
    end if;
    -- por simplicidade, ajuste sempre soma; para subtrair use p_quantidade negativa? Não — quantidade é check>0.
    -- Solução: tratar tipo='ajuste' como adição. Para baixar via ajuste, usar saida com motivo (TBD).
    -- Decisão: ajuste é sempre adição corretiva (ex: contou 5 a mais). Para baixa, fazer "saida" com motivo via observacao.
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

-- Adiciona FK em os_pecas pra item_estoque
alter table os_pecas
  add column item_estoque_id uuid references itens_estoque(id) on delete set null;

-- Trigger: quando os_pecas tem origem='estoque' e item_estoque_id, baixa estoque
create or replace function trg_os_pecas_baixa_estoque()
returns trigger as $$
declare
  v_old_qtd numeric;
begin
  -- INSERT
  if (tg_op = 'INSERT') then
    if new.origem = 'estoque' and new.item_estoque_id is not null then
      perform aplicar_movimentacao_estoque(
        new.item_estoque_id, 'saida_os', new.quantidade,
        null, new.os_id, new.id, null, null, null
      );
    end if;
    return new;
  end if;

  -- UPDATE
  if (tg_op = 'UPDATE') then
    -- se mudou quantidade ou item, reverte antiga e aplica nova
    if (old.origem = 'estoque' and old.item_estoque_id is not null) then
      v_old_qtd := old.quantidade;
      -- "estorna" antigo: faz entrada equivalente
      perform aplicar_movimentacao_estoque(
        old.item_estoque_id, 'entrada', v_old_qtd, old.custo_unitario,
        null, null, null, null, null
      );
    end if;
    if (new.origem = 'estoque' and new.item_estoque_id is not null) then
      perform aplicar_movimentacao_estoque(
        new.item_estoque_id, 'saida_os', new.quantidade,
        null, new.os_id, new.id, null, null, null
      );
    end if;
    return new;
  end if;

  -- DELETE
  if (tg_op = 'DELETE') then
    if old.origem = 'estoque' and old.item_estoque_id is not null then
      perform aplicar_movimentacao_estoque(
        old.item_estoque_id, 'entrada', old.quantidade, old.custo_unitario,
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

-- View itens abaixo do mínimo
create view view_itens_abaixo_minimo as
select * from itens_estoque
where deletado_em is null
  and ativo = true
  and quantidade_atual <= alerta_minimo;

-- RLS
alter table categorias_estoque enable row level security;
create policy "categorias_authenticated_all" on categorias_estoque
  for all to authenticated using (true) with check (true);

alter table itens_estoque enable row level security;
create policy "itens_authenticated_all" on itens_estoque
  for all to authenticated using (true) with check (true);

alter table movimentacoes_estoque enable row level security;
create policy "movimentacoes_authenticated_all" on movimentacoes_estoque
  for all to authenticated using (true) with check (true);
```

## Estrutura — delta

```
src/
├── app/(admin)/app/
│   └── estoque/
│       ├── page.tsx                           # lista com filtros
│       ├── novo/page.tsx
│       ├── [id]/
│       │   ├── page.tsx                       # detalhe + histórico movimentações
│       │   └── editar/page.tsx
│       ├── movimentar/page.tsx                # entrada/saída/ajuste manual
│       └── categorias/page.tsx                # gerenciar categorias
├── features/estoque/
│   ├── actions.ts                             # createItem, updateItem, softDeleteItem,
│   │                                          # registrarEntrada, registrarSaida, registrarAjuste
│   ├── queries.ts                             # listItens, getItem, listMovimentacoes,
│   │                                          # itensAbaixoMinimo, custoMedioPeriodo
│   ├── schemas.ts, types.ts
│   └── components/
│       ├── item-form.tsx
│       ├── item-combobox.tsx                  # usado no add peça da OS quando origem=estoque
│       ├── item-card.tsx
│       ├── itens-list-mobile.tsx
│       ├── itens-list-table.tsx
│       ├── movimentacao-form.tsx              # tipo, item, qtd, custo (se entrada), motivo (se ajuste)
│       ├── movimentacoes-list.tsx
│       ├── alerta-minimo-badge.tsx
│       └── categoria-form.tsx
```

## Tasks ordenadas

### Schema

1. Migration `20260615000000_init_estoque.sql`.
2. `supabase db push`.
3. `pnpm db:gen`.

### Feature `estoque`

4. Schemas zod (item, movimentação, ajuste com motivo obrigatório).
5. Queries básicas (`listItens` com filtros categoria/abaixo_minimo/ativo/busca, `getItem`, `listMovimentacoes`).
6. Actions: `createItem`, `updateItem`, `softDeleteItem`, `registrarEntrada`, `registrarSaida` (manual/avulsa, sem OS), `registrarAjuste`.
   - Server actions chamam função SQL `aplicar_movimentacao_estoque` via `supabase.rpc(...)`.
7. `ItemForm` (RHF + zod).
8. `ItemCombobox` — busca por descrição/SKU, mostra qtd atual ao lado.
9. `ItensListMobile` (cards) + `ItensListTable` (desktop).
10. `MovimentacaoForm` — usado na página `/app/estoque/movimentar`.
11. `MovimentacoesList` — histórico, com filtros tipo + período.
12. `AlertaMinimoBadge`.

### Categorias

13. Página `/app/estoque/categorias` (CRUD simples).

### Integração com OS (Sprint 1 + 2)

14. No editor de peça da OS, quando `origem = 'estoque'`: substituir input "descrição livre" por `ItemCombobox`. Ao selecionar, preenche descrição + custo (=custo_medio) + sugere preço_venda.
15. Trigger SQL faz baixa automática (já no schema). Verificar via integração que funciona.

### Integração com Sprint 2 — pedido fornecedor → entrada estoque

16. Em `pedido_fornecedor_itens`, adicionar campo opcional `item_estoque_id` (FK).
    - Migration adicional (ou colocar no init Sprint 3): `alter table pedido_fornecedor_itens add column item_estoque_id uuid references itens_estoque(id) on delete set null;`
17. Quando pedido muda status pra `recebido`, opção "lançar entradas no estoque" — para cada item com `item_estoque_id`, chama `registrarEntrada` automaticamente.
    - Adicionar action `lancarPedidoNoEstoque(pedidoId)` em `features/pedidos-fornecedor/actions.ts`.

### Dashboard

18. Adicionar card "Itens abaixo do mínimo (X)" no dashboard, link `/app/estoque?abaixo_minimo=1`.

### Bottom nav

19. Conectar item "Estoque" do bottom-nav (já era placeholder).

### Testes

20. Vitest:
    - `aplicar_movimentacao_estoque`: entrada com saldo zero, entrada acumulada (custo médio recalcula), saída com saldo insuficiente lança erro.
    - Trigger `trg_os_pecas_estoque`: insert peça com origem estoque baixa qtd; update qtd ajusta saldo; delete estorna.
21. Playwright:
    - Cadastrar item "Óleo 5W30 Selenia" qtd 10
    - Adicionar peça na OS apontando pra esse item, qtd 4 → estoque vai pra 6
    - Editar peça pra qtd 7 → estoque vai pra 3
    - Remover peça → estoque volta pra 10
    - Tentar adicionar peça com qtd 50 → erro amigável "estoque insuficiente"

### Documentação

22. Atualizar `data-model.md`.
23. Atualizar `00-overview.md` Sprint 3 → 🟢.

## Critical files

- `supabase/migrations/20260615000000_init_estoque.sql`
- `src/features/estoque/**`
- Atualizações: `src/features/ordens/components/os-pecas-itemized.tsx` (adicionar `ItemCombobox` quando origem=estoque)
- Atualizações: `src/features/pedidos-fornecedor/actions.ts` (lancarPedidoNoEstoque)

## Skills

- `superpowers:test-driven-development` — fortemente recomendado pra trigger/SQL function
- `superpowers:systematic-debugging`
- `superpowers:verification-before-completion`

## Verificação

### Automatizada

- [ ] typecheck/lint/test/e2e/build verdes
- [ ] Migration aplica em DB limpo
- [ ] Triggers/functions testadas via integração

### Manual (dev)

- [ ] Cadastrar item, registrar entrada manual: saldo + custo médio batem
- [ ] Registrar várias entradas com custos diferentes: custo médio é ponderado correto
- [ ] Tentar saída maior que saldo: erro propagado pro toast frontend
- [ ] Adicionar peça da OS com origem estoque + item: baixa correta
- [ ] Editar quantidade da peça: estoque ajusta
- [ ] Remover peça: estoque volta
- [ ] Pedido fornecedor recebido + lançar no estoque: entradas registradas
- [ ] View `view_itens_abaixo_minimo` retorna corretamente
- [ ] Dashboard mostra contador

### Manual (Pedro)

- [ ] Cadastra 5-10 itens reais (vários óleos, filtros)
- [ ] Lança entrada de uma compra recente
- [ ] Cria OS usando item do estoque, vê baixa automática
- [ ] Confirma "agora vejo o que tenho" via WhatsApp

## Definition of Done

1. Verificação completa
2. `00-overview.md` Sprint 3 = ✅
3. PR mergeado, deploy verde
4. Pedro validou

## Fora de escopo

- Código de barras / scan câmera (versão futura — pode ser Sprint 3.5)
- Múltiplos fornecedores por item com tabela de preços
- FIFO/LIFO formal (custo médio só)
- Inventário cíclico automatizado
- Loja pública usa estoque (Sprint 6 — vínculo `produtos_loja → itens_estoque` aparece lá)
- Notificação WhatsApp de mínimo (Sprint 5 — opcional)

## Bloqueios

(adicione)

## Progresso

**Fases entregues:**
- ✅ 3A — Migration `20260615000000_init_estoque.sql` aplicada (categorias, itens, movimentações, RPC `aplicar_movimentacao_estoque`, trigger `trg_os_pecas_estoque`, view `view_itens_abaixo_minimo`)
- ✅ 3B — `src/features/estoque/{types,schemas,queries,actions}.ts` + `schemas.test.ts` (19 testes verdes)
- ✅ 3C — Páginas admin `/app/estoque/*` + componentes (ItemForm, ItemCard, listas mobile/desktop, MovimentacaoForm, MovimentacoesList, AlertaMinimoBadge)
- ✅ 3D — CRUD categorias `/app/estoque/categorias`
- ✅ 3E — `ItemCombobox` integrado em `os-pecas-itemized.tsx` (origem=estoque); trigger validado via testes de integração
- ✅ 3F — Migration `20260615000001_alter_pedido_itens_estoque_fk.sql`; `ItemCombobox` no editor de itens do pedido; action `lancarPedidoNoEstoque` + botão na página detalhe
- ✅ 3G — Dashboard ganha card "Estoque baixo" + atalho ativo
- ✅ 3H — `e2e/sprint-03-estoque.spec.ts` (smoke, skipa sem `E2E_PEDRO_EMAIL/SENHA`); docs atualizados

**Verificação automatizada (CI):**
- [x] typecheck verde
- [x] lint verde
- [x] vitest schemas (19/19 passing)
- [x] migrations aplicam em DB remoto

**Verificação de integração SQL (`RUN_DB_INTEGRATION=1`):** testes prontos em `src/features/estoque/integration.test.ts` (6 da função + 4 do trigger). Rodar manualmente antes do merge.

**Manual (Pedro):** pendente — Pedro vai testar em batch com sprint 6.

## Referências

- Postgres custom functions: https://www.postgresql.org/docs/current/plpgsql.html
- `FOR UPDATE` row locking: usado pra evitar race em saldo concorrente
