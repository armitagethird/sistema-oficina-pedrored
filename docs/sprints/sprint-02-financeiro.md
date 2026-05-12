# Sprint 2 — Financeiro (peças sob encomenda + parcelas + ML afiliado)

> **Self-contained.** Leia também `CLAUDE.md`, `docs/00-overview.md`, `docs/architecture/{stack,data-model}.md`. Sprints 0 e 1 devem estar ✅ antes desta começar.

## Status

🟢 Implementada (aguardando validação manual). Branch `sprint-02-financeiro`.

## Contexto

**Esta é a sprint que resolve a dor #1 do Pedro.** Ele compra peças do fornecedor com dinheiro próprio, marca markup, vende ao cliente. Quando cliente atrasa pagamento e há vários carros simultâneos, perde o rastro de quem deve quanto e do quanto investiu de capital próprio.

Esta sprint estrutura: cadastro de fornecedores, registro de pedidos a fornecedores (vinculados a OS quando aplicável), controle de pagamentos do cliente em parcelas (à vista/PIX/dinheiro/sinal), contas a receber consolidado, e tracking de links de afiliado Mercado Livre enviados.

## Pré-requisitos

- Sprint 1 ✅ — `ordens_servico`, `os_pecas` existem.
- Pedro tem dados reais no sistema (algumas OS já criadas) — ajuda a validar.

## Objetivo

Ao final desta sprint Pedro consegue:

1. Cadastrar fornecedor (nome, telefone, observações).
2. Registrar pedido a fornecedor (lista de itens, valor pago, data, opcionalmente vinculado a OS).
3. Marcar peça da OS como vinda de pedido específico (link `os_pecas → pedidos_fornecedor` via item).
4. Registrar pagamento do cliente em parcelas: cada parcela tem valor + método + data prevista + status.
5. Tela "Contas a receber" consolidada por cliente: total pendente + parcelas atrasadas em destaque.
6. Tela "Capital investido" — total de pedidos a fornecedor não compensados (soma do que ele desembolsou e ainda não recebeu de volta via OS paga).
7. Enviar link de afiliado ML pra cliente: registra qual link, qual peça, comissão estimada, status (`enviado | cliente_comprou | comissao_recebida`). Toggle para marcar quando ML pagou.
8. Cron diário marca parcelas vencidas como `atrasado` automaticamente.

## Decisões já tomadas

- Pagamentos do cliente são modelados como **N pagamentos por OS** (parcelas), não como campo único da OS. Cada parcela tem método/data/status próprio.
- Sinal antecipado pra encomenda = um `pagamento` registrado antes da OS estar "pronta", método tipicamente PIX.
- Cartão de crédito é enum `cartao` mas **não usado no MVP** — Pedro não tem maquininha. Adicionado ao enum pra evitar migration futura.
- Pedidos a fornecedor podem ter 1 a N itens. Não obrigatório vincular a OS (ex: Pedro compra estoque pra ter pronto).
- Vinculação `os_pecas → pedido_fornecedor_itens` é opcional: peça da OS pode ter origem `fornecedor` sem ainda ter pedido criado (status `pendente`).
- Markup é manual (Pedro digita preço de venda). Sistema mostra margem calculada (preço_venda - custo) por peça.
- ML afiliado: cliente compra direto, Pedro recebe comissão depois. Sistema só rastreia + permite marcar "comissão recebida" quando ML paga.
- Cron job: Vercel Cron chama `/api/cron/financeiro/marca-atrasados` diariamente 09:00 BRT.

## Stack desta sprint (deps)

```bash
pnpm add date-fns       # já no projeto (Sprint 1) — caso não esteja
pnpm add recharts       # gráficos contas a receber simples
```

shadcn adicional (se ainda não):
```bash
npx shadcn@latest add accordion alert progress
```

## Schema delta — `supabase/migrations/20260601000000_init_financeiro.sql`

```sql
-- Enums
create type pagamento_metodo as enum ('pix', 'dinheiro', 'cartao', 'transferencia');
create type pagamento_status as enum ('pendente', 'pago', 'atrasado', 'cancelado');
create type pedido_fornecedor_status as enum ('cotacao', 'comprado', 'recebido', 'cancelado');
create type link_afiliado_status as enum ('enviado', 'cliente_comprou', 'comissao_recebida', 'cancelado');

-- Fornecedores
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
create trigger trg_fornecedores_atualizado_em before update on fornecedores
  for each row execute function set_atualizado_em();

-- Pedidos a fornecedor
create table pedidos_fornecedor (
  id uuid primary key default gen_random_uuid(),
  numero serial unique not null,
  fornecedor_id uuid not null references fornecedores(id) on delete restrict,
  os_id uuid references ordens_servico(id) on delete set null,    -- pode existir sem OS (compra pra estoque)
  status pedido_fornecedor_status not null default 'cotacao',
  valor_total numeric(12,2) not null default 0,
  data_compra date,
  data_recebimento date,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_pedidos_fornecedor_status on pedidos_fornecedor(status);
create index idx_pedidos_fornecedor_os on pedidos_fornecedor(os_id);
create trigger trg_pedidos_fornecedor_atualizado_em before update on pedidos_fornecedor
  for each row execute function set_atualizado_em();

-- Itens do pedido
create table pedido_fornecedor_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos_fornecedor(id) on delete cascade,
  descricao text not null,
  custo_unitario numeric(12,2) not null check (custo_unitario >= 0),
  quantidade numeric(8,2) not null default 1 check (quantidade > 0),
  subtotal numeric(12,2) generated always as (custo_unitario * quantidade) stored,
  os_peca_id uuid references os_pecas(id) on delete set null,    -- vínculo opcional com peça da OS
  criado_em timestamptz not null default now()
);
create index idx_pedido_itens_pedido on pedido_fornecedor_itens(pedido_id);
create index idx_pedido_itens_os_peca on pedido_fornecedor_itens(os_peca_id);

-- Recalcula valor_total do pedido
create or replace function recalcula_total_pedido_fornecedor(p_pedido_id uuid)
returns void as $$
begin
  update pedidos_fornecedor
    set valor_total = (select coalesce(sum(subtotal),0) from pedido_fornecedor_itens where pedido_id = p_pedido_id)
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

-- Pagamentos (parcelas) do cliente, vinculados a OS
create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete restrict,
  ordem int not null default 1,                          -- 1ª parcela, 2ª parcela, etc.
  valor numeric(12,2) not null check (valor > 0),
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
create trigger trg_pagamentos_atualizado_em before update on pagamentos
  for each row execute function set_atualizado_em();

-- Marca data_paga automaticamente quando status vira 'pago'
create or replace function trg_pagamentos_marca_data_paga()
returns trigger as $$
begin
  if new.status = 'pago' and (old.status is null or old.status <> 'pago') then
    new.data_paga = coalesce(new.data_paga, now());
  end if;
  return new;
end;
$$ language plpgsql;
create trigger trg_pagamentos_data_paga before insert or update on pagamentos
  for each row execute function trg_pagamentos_marca_data_paga();

-- Links afiliado ML enviados
create table links_afiliado_enviados (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  os_id uuid references ordens_servico(id) on delete set null,
  link text not null,
  descricao_peca text not null,
  preco_estimado numeric(12,2),
  comissao_estimada numeric(12,2),
  comissao_recebida numeric(12,2),
  status link_afiliado_status not null default 'enviado',
  data_envio timestamptz not null default now(),
  data_compra timestamptz,
  data_comissao timestamptz,
  observacoes text
);
create index idx_links_cliente on links_afiliado_enviados(cliente_id);
create index idx_links_status on links_afiliado_enviados(status);

-- View: contas a receber
create view view_contas_a_receber as
select
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.telefone,
  count(p.id) filter (where p.status in ('pendente','atrasado')) as parcelas_em_aberto,
  count(p.id) filter (where p.status = 'atrasado') as parcelas_atrasadas,
  coalesce(sum(p.valor) filter (where p.status in ('pendente','atrasado')), 0) as total_em_aberto,
  coalesce(sum(p.valor) filter (where p.status = 'atrasado'), 0) as total_atrasado,
  min(p.data_prevista) filter (where p.status in ('pendente','atrasado')) as proxima_data
from clientes c
join ordens_servico os on os.cliente_id = c.id and os.deletado_em is null
join pagamentos p on p.os_id = os.id
where c.deletado_em is null
group by c.id, c.nome, c.telefone;

-- View: capital investido (pedidos comprados não compensados ainda)
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
  -- "compensado" = quando OS associada tem total_geral pago em 100%
  coalesce(
    (select sum(p.valor) from pagamentos p where p.os_id = os.id and p.status = 'pago'),
    0
  ) as cliente_pagou,
  os.total_geral as os_total
from pedidos_fornecedor pf
join fornecedores f on f.id = pf.fornecedor_id
left join ordens_servico os on os.id = pf.os_id
left join clientes c on c.id = os.cliente_id
where pf.status in ('comprado','recebido')
  and (
    os.id is null                                -- compra sem OS (estoque puro)
    or coalesce(
      (select sum(p.valor) from pagamentos p where p.os_id = os.id and p.status = 'pago'), 0
    ) < os.total_geral
  );

-- Função: marca atrasados (chamada por cron diário)
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

-- RLS
alter table fornecedores enable row level security;
create policy "fornecedores_authenticated_all" on fornecedores
  for all to authenticated using (true) with check (true);

alter table pedidos_fornecedor enable row level security;
create policy "pedidos_fornecedor_authenticated_all" on pedidos_fornecedor
  for all to authenticated using (true) with check (true);

alter table pedido_fornecedor_itens enable row level security;
create policy "pedido_itens_authenticated_all" on pedido_fornecedor_itens
  for all to authenticated using (true) with check (true);

alter table pagamentos enable row level security;
create policy "pagamentos_authenticated_all" on pagamentos
  for all to authenticated using (true) with check (true);

alter table links_afiliado_enviados enable row level security;
create policy "links_afiliado_authenticated_all" on links_afiliado_enviados
  for all to authenticated using (true) with check (true);
```

## Estrutura de pastas — delta

```
src/
├── app/(admin)/app/
│   ├── financeiro/
│   │   ├── page.tsx                           # overview: contas a receber + capital investido (cards)
│   │   ├── contas-a-receber/page.tsx
│   │   ├── capital-investido/page.tsx
│   │   ├── parcelas-atrasadas/page.tsx
│   │   └── pagamentos/[id]/page.tsx           # detalhe parcela
│   ├── fornecedores/
│   │   ├── page.tsx
│   │   ├── novo/page.tsx
│   │   └── [id]/page.tsx
│   ├── pedidos-fornecedor/
│   │   ├── page.tsx
│   │   ├── novo/page.tsx
│   │   └── [id]/page.tsx
│   └── os/[id]/                               # estende detalhe OS Sprint 1
│       └── (já existente)                     # adiciona aba "Pagamentos" e "Links ML"
├── app/api/cron/financeiro/
│   └── marca-atrasados/route.ts               # GET protegido por CRON_SECRET
├── features/
│   ├── fornecedores/
│   │   ├── actions.ts, queries.ts, schemas.ts, types.ts
│   │   └── components/{fornecedor-form,fornecedor-combobox}.tsx
│   ├── pedidos-fornecedor/
│   │   ├── actions.ts, queries.ts, schemas.ts, types.ts
│   │   └── components/{pedido-form,pedido-itens-itemized,vincular-os-peca}.tsx
│   ├── financeiro/
│   │   ├── actions.ts                         # createPagamento, marcarPago, cancelarPagamento, criarParcelasFromOS
│   │   ├── queries.ts                         # contas a receber, capital investido, totais período
│   │   ├── schemas.ts, types.ts
│   │   └── components/
│   │       ├── parcelas-itemized.tsx          # adicionar dentro do detalhe OS
│   │       ├── contas-receber-table.tsx
│   │       ├── capital-investido-table.tsx
│   │       ├── parcela-status-badge.tsx
│   │       └── grafico-receber-30dias.tsx     # recharts
│   └── ml-afiliado/
│       ├── actions.ts                         # registrarLinkEnviado, marcarComprou, marcarComissaoRecebida
│       ├── queries.ts
│       ├── schemas.ts, types.ts
│       └── components/{link-form,links-list,link-status-badge}.tsx
└── shared/
    └── lib/
        └── cron-auth.ts                       # valida header CRON_SECRET
```

## Tasks ordenadas

### Schema

1. Migration `20260601000000_init_financeiro.sql`.
2. `supabase db push`.
3. `pnpm db:gen`.

### Cron auth

4. `src/shared/lib/cron-auth.ts` — função `assertCronAuth(req: Request)` valida `Authorization: Bearer ${CRON_SECRET}`.
5. Adicionar `CRON_SECRET` em `.env.example` e variáveis Vercel (gerar valor aleatório forte).

### Feature `fornecedores`

6. Schemas zod, queries, actions.
7. `FornecedorForm`, `FornecedorCombobox` (dropdown busca + criar inline).
8. Páginas `/app/fornecedores/{,novo,[id]}`.

### Feature `pedidos-fornecedor`

9. Schemas, queries, actions (incluindo `vincularOsPeca`, `mudarStatus`).
10. `PedidoForm` (com `FornecedorCombobox` + `PedidoItensItemized` + opção vincular OS).
11. `VincularOsPecaModal` — dentro do item do pedido, busca peças pendentes de OS recentes.
12. Páginas `/app/pedidos-fornecedor/{,novo,[id]}`.

### Feature `financeiro`

13. Schemas, queries (contas a receber, capital investido, totais período).
14. Action `criarParcelasFromOS(osId, parcelas: { valor, metodo, dataPrevista }[])` — facilita criar várias de uma vez.
15. Actions individuais: `createPagamento`, `marcarPago`, `cancelarPagamento`, `editarPagamento`.
16. `ParcelasItemized` — componente que vai dentro de aba "Pagamentos" no detalhe OS. Mostra parcelas existentes + form para adicionar nova.
17. `ContasReceberTable` (mobile cards + desktop table) — agrupada por cliente, expansível mostrando parcelas detalhadas.
18. `CapitalInvestidoTable` — lista pedidos a fornecedor com saldo "ainda preciso receber" calculado.
19. `GraficoReceber30Dias` — barras com somatório por dia previsto pra próximos 30 dias (recharts).
20. `ParcelaStatusBadge`.
21. Páginas:
    - `/app/financeiro` (overview com cards: total a receber, total atrasado, capital investido, gráfico 30 dias)
    - `/app/financeiro/contas-a-receber`
    - `/app/financeiro/capital-investido`
    - `/app/financeiro/parcelas-atrasadas`

### Feature `ml-afiliado`

22. Schemas, queries, actions.
23. `LinkForm` — form rápido pra registrar link enviado.
24. `LinksList` — agrupado por status, com toggle pra marcar evolução.
25. Aba "Links ML" no detalhe OS + seção em detalhe cliente.

### Integração com OS (Sprint 1)

26. Adicionar tabs "Pagamentos" e "Links ML" em `OsDetalheTabs`.
27. Adicionar campo "vincular a pedido fornecedor" no editor de peça da OS (ou caminho reverso: vincular peça quando criar pedido).
28. No detalhe OS, mostrar progresso pagamento (`Total pago R$ X / Total OS R$ Y` com `Progress` component).

### Cron route

29. `/api/cron/financeiro/marca-atrasados/route.ts` — GET, valida CRON_SECRET, chama RPC `marca_pagamentos_atrasados()`, retorna `{ atualizados: N }`.
30. Atualizar `vercel.json` com cron `0 9 * * *` apontando pra essa rota.

### Testes

31. Vitest:
    - Schemas zod
    - View `view_contas_a_receber` retorna agregação correta (teste integração com Supabase local)
    - `marca_pagamentos_atrasados()` muda status corretos (teste integração)
32. Playwright:
    - Cria OS, adiciona pagamento à vista, marca como pago → não aparece em contas a receber
    - Cria OS com 3 parcelas, paga 1, atrasa 1 → aparece em contas a receber + atrasadas
    - Registra link ML, marca cliente comprou, marca comissão recebida → some de "pendente"

### Documentação

33. Atualizar `docs/architecture/data-model.md`.
34. Atualizar `docs/architecture/deploy.md` se cron novo.
35. Atualizar `docs/00-overview.md` Sprint 2 → 🟢.

## Critical files

- `supabase/migrations/20260601000000_init_financeiro.sql`
- `src/features/{fornecedores,pedidos-fornecedor,financeiro,ml-afiliado}/**`
- `src/app/api/cron/financeiro/marca-atrasados/route.ts`
- `src/shared/lib/cron-auth.ts`
- `vercel.json`

## Skills

- `superpowers:writing-plans`
- `superpowers:test-driven-development` — lógica de parcelas/atraso
- `superpowers:systematic-debugging`
- `superpowers:verification-before-completion`
- `superpowers:requesting-code-review`

## Verificação

### Automatizada

- [ ] typecheck/lint/test/e2e/build verdes
- [ ] Migration aplica em DB limpo
- [ ] Views retornam linhas esperadas em fixture de teste
- [ ] Cron route responde 401 sem secret, 200 com secret correto

### Manual (dev)

- [ ] Criar fornecedor + pedido + 3 itens → valor_total bate
- [ ] Vincular item de pedido a peça de OS → relação aparece em ambos os lados
- [ ] Criar 3 parcelas em OS → soma = total_geral (validação no form)
- [ ] Marcar pagamento → data_paga preenchida, status atualizado
- [ ] Forçar parcela com data_prevista no passado → cron move pra atrasado
- [ ] View `contas_a_receber` reflete estado atual
- [ ] Registrar link ML → aparece na aba do cliente e da OS
- [ ] Gráfico 30 dias renderiza com dados reais

### Manual (Pedro)

- [ ] Pedro registra fornecedor real (Auto Peças X)
- [ ] Cria pedido vinculado a OS de cliente real
- [ ] Lança 2 parcelas de pagamento (sinal + saldo)
- [ ] Marca sinal pago
- [ ] Vê tela "Contas a receber" com saldo do cliente
- [ ] Vê tela "Capital investido" mostrando o pedido
- [ ] Manda link ML pro cliente e registra
- [ ] Confirma "agora consigo controlar" via WhatsApp

## Definition of Done

1. Verificação completa.
2. `docs/00-overview.md` Sprint 2 = ✅.
3. PR mergeado, deploy verde, cron rodando em produção.
4. Pedro validou.

## Fora de escopo (explícito)

- Cartão de crédito real (apenas no enum, sem fluxo).
- Integração com gateways de pagamento.
- Boletos.
- Nota fiscal eletrônica.
- DRE / contabilidade formal.
- Análise de margem geral (Sprint 7).
- Notificações WhatsApp de cobrança (Sprint 5 — apenas registra dados aqui).

## Bloqueios

Nenhum.

## Progresso

Implementada em 9 fases entre 2026-05-11, branch `sprint-02-financeiro`:

| Fase | Commit | O que entregou |
|------|--------|----------------|
| A | `1f795fd` | Migration `20260601000000_init_financeiro.sql` aplicada no remoto; `src/shared/lib/cron-auth.ts`; deps `recharts` + shadcn (accordion/alert/progress); `CRON_SECRET` no template |
| B | `906a5d4` | `src/features/fornecedores/*` completo + páginas `/app/fornecedores/{,/novo,/[id],/[id]/editar}` |
| C | `2eade52` | `src/features/pedidos-fornecedor/*` + state machine + vinculação peça-OS + `os-combobox` reusável + 4 páginas |
| D | `91e0546` | `src/features/financeiro/*` (parcelas, contas a receber, capital investido, gráfico 30 dias, 4 páginas `/app/financeiro/*`) |
| E | `9806d4f` | `src/features/ml-afiliado/*` + seção no detalhe cliente |
| F | `578fe95` | `getOSDetalhe` estendida; abas Pagamentos + Links ML no detalhe OS; badge "Pedido #N" em peças vinculadas |
| G | `ff1d249` | `/api/cron/financeiro/marca-atrasados` + `vercel.json` (cron `0 12 * * *` = 09h BRT); `createServiceRoleClient()` |
| H | `8aebc51` | 3 testes integração SQL (skip por padrão) + spec Playwright Sprint 2 |
| I | (este commit) | docs atualizados (data-model, deploy, 00-overview) |

**Verificação automatizada final:** typecheck/lint/115 testes (112 ativos + 3 integration skipados)/build verdes.

**Pendente pro Pedro:**
- [ ] Configurar `CRON_SECRET` em Vercel → Settings → Env Vars (production + preview)
- [ ] Deploy do branch via PR
- [ ] Validar manualmente os fluxos da seção "Manual (Pedro)" abaixo

## Referências

- Vercel Cron: https://vercel.com/docs/cron-jobs
- Recharts: https://recharts.org
- View materializada vs view: usamos view simples; se virar gargalo, materializa.
