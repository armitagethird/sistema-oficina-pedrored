# Sprint 1 — Core Ordens de Serviço

> **Self-contained.** Leia também `CLAUDE.md`, `docs/00-overview.md`, `docs/architecture/{stack,data-model}.md`. Sprint 0 deve estar ✅ antes desta começar.

## Status

⚪ Pendente.

## Contexto

Sprint 0 entregou shell vazio + auth + tabelas `clientes`/`veiculos`. Agora Pedro precisa **operar a oficina no sistema**: cadastrar cliente, cadastrar veículo, abrir ordem de serviço, lançar serviços e peças, anexar fotos antes/depois, mudar status conforme andamento, ver histórico do veículo.

Sem essa sprint Pedro não tem motivo nenhum pra abrir o sistema. Esta é a primeira sprint que entrega valor real.

## Pré-requisitos

- Sprint 0 ✅ validada por Pedro.
- Tabelas `clientes`, `veiculos`, `vw_modelos` existem com seed.
- Bucket Supabase Storage `os-fotos` precisa ser criado nesta sprint (privado).
- Pedro tem conta logada em produção e PWA instalado.

## Objetivo

Ao final desta sprint Pedro consegue, no celular dele:

1. Cadastrar cliente novo em <30 segundos.
2. Cadastrar veículo VW (autocomplete por modelo+motor) ou veículo custom.
3. Abrir OS com cliente+veículo+km+descrição do problema.
4. Adicionar 3 serviços (mão de obra) com valores. Total bate.
5. Adicionar 2 peças (origem fornecedor, manual) com custo+venda. Total bate.
6. Tirar foto da entrada com câmera do celular. Aparece na OS. Idem foto saída.
7. Mudar status: aberta → em_andamento → aguardando_peca → pronta → entregue.
8. Filtrar listagem de OS por status (default: ativas — tudo exceto entregue/cancelada).
9. Ver detalhe de veículo com histórico de OS + timeline de km.
10. Dashboard mostra contadores: X aberta(s), Y em andamento, Z prontas pra retirar.

## Decisões já tomadas

- OS tem 4 entidades filhas: `os_servicos`, `os_pecas`, `os_fotos`, e (futuramente) `pagamentos` (Sprint 2).
- Esta sprint trata `os_pecas` como digitação manual (origem `fornecedor`). Sprints 2 e 3 expandem o fluxo.
- Status flow: `aberta → em_andamento → aguardando_peca ↔ em_andamento → pronta → entregue`. `cancelada` em qualquer momento.
- Fotos vão pra Supabase Storage privado, exibidas via signed URL (1h).
- Sem WhatsApp ainda — comunicação manual.
- Catálogo VW híbrido: usa `vw_modelos` (FK) ou `modelo_custom` (text). Constraint garante que pelo menos um existe.
- Total da OS é **calculado** (sum de subtotais de serviços + peças venda). Armazenado denormalizado para query rápida via trigger ou recalculo via server action a cada mutação.

## Stack desta sprint (deps a adicionar)

```bash
pnpm add @tanstack/react-table        # tabela OS com filtros e ordenação
pnpm add date-fns                     # manipulação de datas (já queremos no projeto)
pnpm add nanoid                       # ids curtos pra nomes de arquivo upload
```

shadcn adicional:
```bash
npx shadcn@latest add command popover combobox calendar form select textarea
```

## Schema delta — `supabase/migrations/20260520000000_init_ordens_servico.sql`

```sql
-- Enums
create type os_status as enum (
  'aberta', 'em_andamento', 'aguardando_peca', 'pronta', 'entregue', 'cancelada'
);
create type peca_origem as enum (
  'estoque', 'fornecedor', 'mercado_livre_afiliado'
);
create type peca_status as enum (
  'pendente', 'comprada', 'recebida', 'aplicada'
);
create type foto_momento as enum (
  'entrada', 'saida', 'durante'
);

-- Ordens de Serviço
create table ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero serial unique not null,                          -- número humano sequencial (#1, #2, ...)
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
create index idx_os_status on ordens_servico(status) where deletado_em is null;
create index idx_os_cliente on ordens_servico(cliente_id) where deletado_em is null;
create index idx_os_veiculo on ordens_servico(veiculo_id) where deletado_em is null;
create index idx_os_criado on ordens_servico(criado_em desc) where deletado_em is null;
create trigger trg_os_atualizado_em before update on ordens_servico
  for each row execute function set_atualizado_em();

-- Serviços (mão de obra)
create table os_servicos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete cascade,
  descricao text not null,
  valor_unitario numeric(12,2) not null check (valor_unitario >= 0),
  quantidade numeric(8,2) not null default 1 check (quantidade > 0),
  subtotal numeric(12,2) generated always as (valor_unitario * quantidade) stored,
  ordem int not null default 0,                          -- ordem visual na lista
  criado_em timestamptz not null default now()
);
create index idx_os_servicos_os on os_servicos(os_id);

-- Peças
create table os_pecas (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete cascade,
  descricao text not null,
  origem peca_origem not null default 'fornecedor',
  custo_unitario numeric(12,2) not null default 0 check (custo_unitario >= 0),
  preco_venda_unitario numeric(12,2) not null check (preco_venda_unitario >= 0),
  quantidade numeric(8,2) not null default 1 check (quantidade > 0),
  subtotal_venda numeric(12,2) generated always as (preco_venda_unitario * quantidade) stored,
  link_ml text,                                          -- usado quando origem='mercado_livre_afiliado'
  fornecedor_nome text,                                  -- texto livre nesta sprint; FK para fornecedores no Sprint 2
  status peca_status not null default 'pendente',
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index idx_os_pecas_os on os_pecas(os_id);
create index idx_os_pecas_status on os_pecas(status);

-- Fotos
create table os_fotos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete cascade,
  storage_path text not null,                            -- caminho no bucket os-fotos
  momento foto_momento not null,
  legenda text,
  criado_em timestamptz not null default now()
);
create index idx_os_fotos_os on os_fotos(os_id);

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

create trigger trg_os_servicos_recalc
  after insert or update or delete on os_servicos
  for each row execute function trg_recalcula_totais_os();

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
create trigger trg_os_fechado_em before update on ordens_servico
  for each row execute function trg_os_marca_fechado_em();

-- RLS
alter table ordens_servico enable row level security;
create policy "os_authenticated_all" on ordens_servico
  for all to authenticated using (true) with check (true);

alter table os_servicos enable row level security;
create policy "os_servicos_authenticated_all" on os_servicos
  for all to authenticated using (true) with check (true);

alter table os_pecas enable row level security;
create policy "os_pecas_authenticated_all" on os_pecas
  for all to authenticated using (true) with check (true);

alter table os_fotos enable row level security;
create policy "os_fotos_authenticated_all" on os_fotos
  for all to authenticated using (true) with check (true);
```

### Storage policy `os-fotos`

```sql
-- Bucket criado via Supabase Dashboard como private.
-- Policy: usuário authenticated lê/escreve.
insert into storage.buckets (id, name, public) values ('os-fotos', 'os-fotos', false);

create policy "os_fotos_select_auth" on storage.objects
  for select to authenticated
  using (bucket_id = 'os-fotos');

create policy "os_fotos_insert_auth" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'os-fotos');

create policy "os_fotos_delete_auth" on storage.objects
  for delete to authenticated
  using (bucket_id = 'os-fotos');
```

## Estrutura de pastas — delta

```
src/
├── app/(admin)/app/
│   ├── page.tsx                               # dashboard com contadores
│   ├── clientes/
│   │   ├── page.tsx                           # lista
│   │   ├── novo/page.tsx                      # form criar
│   │   └── [id]/
│   │       ├── page.tsx                       # detalhe + lista veículos + OS
│   │       └── editar/page.tsx
│   ├── veiculos/
│   │   ├── novo/page.tsx                      # form criar (tipicamente acessado de cliente/[id])
│   │   └── [id]/
│   │       ├── page.tsx                       # detalhe + histórico OS + timeline km
│   │       └── editar/page.tsx
│   └── os/
│       ├── page.tsx                           # lista filtrável
│       ├── nova/page.tsx                      # wizard criar
│       └── [id]/
│           ├── page.tsx                       # detalhe completo (tabs: Geral, Serviços, Peças, Fotos)
│           ├── editar/page.tsx                # edição header (problema, km)
│           └── actions.ts                     # local actions
├── features/
│   ├── clientes/
│   │   ├── actions.ts                         # createCliente, updateCliente, softDeleteCliente
│   │   ├── queries.ts                         # listClientes, getCliente, searchClientesByTerm
│   │   ├── schemas.ts                         # zod
│   │   ├── types.ts
│   │   └── components/
│   │       ├── cliente-combobox.tsx           # busca + criar inline
│   │       ├── cliente-form.tsx
│   │       └── cliente-card.tsx
│   ├── veiculos/
│   │   ├── actions.ts                         # createVeiculo, updateVeiculo, softDeleteVeiculo
│   │   ├── queries.ts                         # listVeiculosByCliente, getVeiculo, listVwModelos
│   │   ├── schemas.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── veiculo-form.tsx               # com VW autocomplete + custom fallback
│   │       ├── veiculo-selector.tsx           # picker dentro do wizard de OS
│   │       ├── vw-modelo-combobox.tsx
│   │       └── km-timeline.tsx
│   └── ordens/
│       ├── actions.ts                         # createOS, updateOSHeader, addServico, removeServico,
│       │                                      # addPeca, removePeca, mudarStatus, uploadFoto, removeFoto
│       ├── queries.ts                         # listOS (com filtros), getOSDetalhe, contadoresDashboard
│       ├── schemas.ts
│       ├── types.ts
│       └── components/
│           ├── os-status-badge.tsx
│           ├── os-list-table.tsx              # @tanstack/react-table
│           ├── os-list-mobile.tsx             # cards mobile
│           ├── os-wizard.tsx                  # 3 passos (cliente → veículo → problema)
│           ├── os-detalhe-tabs.tsx
│           ├── os-servicos-itemized.tsx
│           ├── os-pecas-itemized.tsx
│           ├── os-fotos-grid.tsx
│           ├── os-foto-uploader.tsx           # input capture="environment"
│           └── os-status-changer.tsx          # menu pra avançar status
└── shared/
    ├── components/
    │   ├── itemized-list.tsx                  # genérico (input descrição, valor, qtd, X remover)
    │   ├── money-input.tsx                    # formata BRL on-blur
    │   ├── empty-state.tsx
    │   └── loading-skeleton.tsx
    └── hooks/
        └── use-supabase-signed-url.ts
```

## Tasks ordenadas

### Schema + tipos

1. Escrever migration `20260520000000_init_ordens_servico.sql` (conteúdo acima).
2. Criar bucket `os-fotos` no Supabase Dashboard (privado) e aplicar policies.
3. `supabase db push`.
4. `pnpm db:gen` para regenerar `database.types.ts`.

### Helpers compartilhados

5. `src/shared/components/money-input.tsx`. TDD: testes com formatação BRL + parse.
6. `src/shared/components/itemized-list.tsx`. Genérico, controlado, props `items`, `onAdd`, `onRemove`, `onChange`.
7. `src/shared/hooks/use-supabase-signed-url.ts` — gera signed URL 1h pra path do storage.

### Feature `clientes`

8. `features/clientes/schemas.ts` — zod `clienteCreateSchema`, `clienteUpdateSchema`.
9. `features/clientes/queries.ts` — `listClientes(opts)`, `getCliente(id)`, `searchClientes(term)`.
10. `features/clientes/actions.ts` — `createCliente`, `updateCliente`, `softDeleteCliente`.
11. Componente `ClienteForm` (RHF + zod resolver).
12. Componente `ClienteCombobox` — busca + opção "+ criar novo" abre dialog inline.
13. Páginas `/app/clientes`, `/app/clientes/novo`, `/app/clientes/[id]`, `/app/clientes/[id]/editar`.

### Feature `veiculos`

14. `features/veiculos/schemas.ts` — validação inclui regra "modelo_id OU modelo_custom".
15. `features/veiculos/queries.ts` — `listVwModelos()`, `searchVwModelos(term)`, `listVeiculosByCliente(clienteId)`, `getVeiculo(id)`.
16. `features/veiculos/actions.ts` — `createVeiculo`, `updateVeiculo`, `softDeleteVeiculo`.
17. `VwModeloCombobox` — busca por modelo+motor; opção "Não está aqui? Inserir manual".
18. `VeiculoForm` com VW combobox + fallback campos manuais (modelo_custom, motor manual).
19. `KmTimeline` — gráfico simples (lista cronológica de km registrados a partir das OS do veículo).
20. Páginas `/app/veiculos/novo`, `/app/veiculos/[id]`, `/app/veiculos/[id]/editar`.

### Feature `ordens` (núcleo)

21. `features/ordens/schemas.ts` — schemas para create OS, add serviço, add peça, mudar status.
22. `features/ordens/queries.ts`:
    - `listOS({ status?, clienteId?, veiculoId?, dateRange? })`
    - `getOSDetalhe(id)` — OS + cliente + veiculo + servicos + pecas + fotos (com signed URLs)
    - `contadoresDashboard()` — counts por status para o dashboard
23. `features/ordens/actions.ts`:
    - `createOS({ clienteId, veiculoId, kmEntrada, descricaoProblema })`
    - `updateOSHeader(id, partial)`
    - `mudarStatus(id, novoStatus, opts?)` — valida transição válida (state machine)
    - `addServico(osId, descricao, valor, qtd)`
    - `updateServico(servicoId, partial)`
    - `removeServico(servicoId)`
    - `addPeca(osId, descricao, origem, custo, preco, qtd, fornecedorNome?, linkML?)`
    - `updatePeca(pecaId, partial)`
    - `removePeca(pecaId)`
    - `mudarStatusPeca(pecaId, novoStatus)`
    - `uploadFoto(osId, file, momento, legenda?)` — usa Supabase Storage com nome `${osId}/${nanoid()}.${ext}`
    - `removeFoto(fotoId)`
24. `OsStatusBadge` (cores: aberta=azul, em_andamento=amarelo, aguardando_peca=laranja, pronta=verde, entregue=cinza, cancelada=vermelho).
25. `OsListMobile` (cards) + `OsListTable` (desktop com tanstack-table). Render condicional via `useIsMobile()`.
26. `OsWizard` (3 passos):
    - Passo 1: `ClienteCombobox` (cria inline se necessário)
    - Passo 2: `VeiculoSelector` (lista veículos do cliente, cria inline)
    - Passo 3: km entrada + descrição problema. Botão "Abrir OS" → cria + redireciona pro detalhe.
27. `OsDetalheTabs` com tabs:
    - **Geral:** info cabeçalho (cliente, veículo, status, datas, total). Botões mudar status (`OsStatusChanger`). Editar header (problema, km, observações).
    - **Serviços:** `OsServicosItemized` (usa `ItemizedList`).
    - **Peças:** `OsPecasItemized` (campos extras: origem dropdown, custo, link ML quando origem=ML).
    - **Fotos:** `OsFotosGrid` agrupado por momento. `OsFotoUploader` com input `capture="environment"`.
28. Página `/app/os` (lista com filtros: status default=ativas, busca por cliente/placa, range de datas).
29. Página `/app/os/nova` (wizard).
30. Página `/app/os/[id]` (detalhe).

### Dashboard

31. `/app/(admin)/app/page.tsx` — cards de contadores (4 cards: aberta, em_andamento, aguardando_peca, pronta). Cada card é link pra `/app/os?status=...`. Lista das 5 OS mais recentes embaixo.

### Testes

32. Vitest:
    - Schemas zod (rejeita inválidos, aceita válidos).
    - State machine de status (transições válidas).
    - `recalcula_totais_os` testado via integração contra Supabase local.
33. Playwright E2E (smoke da jornada completa):
    - Loga
    - Cria cliente novo
    - Cria veículo Polo 1.0 TSI 2020
    - Abre OS (km 50000, "Revisão completa")
    - Adiciona 2 serviços + 1 peça
    - Muda status pra "pronta"
    - Volta pro dashboard, vê contador "1 pronta"

### Documentação

34. Atualizar `docs/architecture/data-model.md` "Estado atual" com tabelas/enums novos.
35. Atualizar `docs/00-overview.md` Sprint 1 → 🟢 quando implementação OK.

## Critical files

- Migration: `supabase/migrations/20260520000000_init_ordens_servico.sql`
- Tipos: `src/lib/supabase/database.types.ts` (regenerado)
- Features: `src/features/{clientes,veiculos,ordens}/**`
- Páginas: `src/app/(admin)/app/{page,clientes,veiculos,os}/**`
- Componentes shared: `src/shared/components/{itemized-list,money-input,empty-state}.tsx`

## Skills a invocar

- `superpowers:writing-plans` (recomendado — sprint grande)
- `superpowers:test-driven-development` — features de domínio (ordens)
- `superpowers:systematic-debugging` — qualquer bug de trigger SQL
- `superpowers:verification-before-completion`
- `superpowers:requesting-code-review` (cavecrew-reviewer ou pr-review-toolkit:review-pr) antes de fechar
- `andrej-karpathy-skills:karpathy-guidelines`

## Verificação

### Automatizada

- [ ] `pnpm typecheck` passa
- [ ] `pnpm lint` passa
- [ ] `pnpm test` passa (todos vitest)
- [ ] `pnpm e2e` passa (smoke jornada completa)
- [ ] `pnpm build` passa
- [ ] Migration aplica em Supabase limpo sem erro (`supabase db reset`)
- [ ] CI verde

### Manual (dev)

- [ ] CRUD cliente funciona (criar, listar, ver detalhe, editar, soft delete)
- [ ] CRUD veículo funciona (com VW combobox + fallback custom)
- [ ] Wizard OS cria OS válida em <30s
- [ ] Adicionar/remover serviço/peça atualiza total automaticamente (verificar trigger)
- [ ] Upload de foto via celular (capture="environment") salva no Storage e exibe via signed URL
- [ ] State machine: tentar mudar de "entregue" pra "aberta" falha com erro amigável
- [ ] Filtros de listagem funcionam (status, busca por nome cliente, range datas)
- [ ] Dashboard mostra contadores corretos
- [ ] `fechado_em` preenche automaticamente quando status vai pra "entregue"
- [ ] Soft delete cliente bloqueia se tiver veículo/OS ativos (FK RESTRICT)

### Manual (Pedro)

- [ ] Pedro cadastra 2 clientes reais no celular
- [ ] Cadastra veículos deles
- [ ] Abre OS pra cada um, lança serviços + peças
- [ ] Tira foto entrada com câmera
- [ ] Avança status durante o dia conforme trabalha
- [ ] Confirma "consegui usar sem confusão" via WhatsApp

## Definition of Done

1. Toda checkbox marcada.
2. `docs/00-overview.md` Sprint 1 = ✅.
3. `docs/architecture/data-model.md` atualizado.
4. PR mergeado, deploy verde.
5. Pedro confirmou validação.

## Fora de escopo (explícito)

- **Pagamentos/parcelas** — Sprint 2.
- **Fluxo de fornecedor estruturado** — Sprint 2 (aqui peças têm `fornecedor_nome` como texto livre).
- **Integração com estoque** — Sprint 3 (origem `estoque` ainda não conecta).
- **Tracking ML afiliado estruturado** — Sprint 2 (aqui só salva `link_ml` na peça).
- **Agenda integrada com OS** — Sprint 4.
- **Notificações WhatsApp** — Sprint 5.
- **Loja pública** — Sprint 6.
- **Métricas/dashboards avançados** — Sprint 7.
- **Edição de OS após "entregue"** — bloqueado (precisa cancelar e reabrir manualmente; manter regra simples).

## Bloqueios conhecidos

(adicione durante execução)

## Progresso

(atualize)

## Referências

- shadcn Combobox: https://ui.shadcn.com/docs/components/combobox
- @tanstack/react-table v8: https://tanstack.com/table/v8
- HTML capture API: `<input type="file" accept="image/*" capture="environment" />`
- Supabase Storage signed URLs: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl
