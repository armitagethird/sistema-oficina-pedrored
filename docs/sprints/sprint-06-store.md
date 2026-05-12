# Sprint 6 — PedroRed Store (loja pública)

> **Self-contained.** Leia também `CLAUDE.md`, `docs/00-overview.md`, `docs/architecture/{stack,data-model,deploy}.md`. Sprints 0–5 ✅.

## Status

🟢 Implementada na branch `sprint-03-06` (em conjunto com Sprint 3 por decisão do Romero — PR único pendente).

## Contexto

Loja pública para Pedro vender peças e materiais online. Reusa estoque (Sprint 3) — quando produto está vinculado a item de estoque, sincroniza preço e quantidade. Anônima (sem cadastro) — cliente preenche nome+telefone+endereço no checkout. Pagamento via PIX (QR estático gerado server-side). Após upload de comprovante, Pedro confirma manualmente.

Construído como **route group `(public)` no mesmo Next.js app** (decisão arquitetural fechada em conversa com Romero — não monorepo, não Astro separado). Acessível pela raiz do domínio quando produção tiver `pedrored.com.br`.

## Pré-requisitos

- Sprint 3 ✅ — `itens_estoque` existem para vinculação opcional.
- Domínio `pedrored.com.br` registrado e apontado para Vercel.
- Chave PIX do Pedro definida em env vars (`PIX_CHAVE`, `PIX_NOME_BENEFICIARIO`, `PIX_CIDADE`).

## Objetivo

1. Home pública em `/` mostra hero + produtos em destaque + categorias.
2. Catálogo paginado `/produtos` com filtros (categoria, faixa preço).
3. Página produto `/produto/[slug]` com fotos, descrição, preço, estoque, botão "Adicionar ao carrinho" + "Comprar agora".
4. Carrinho `/carrinho` com lista + quantidades + total.
5. Checkout `/checkout`: dados cliente (nome, telefone, endereço) + revisão + gerar PIX QR + upload comprovante.
6. Página de status `/pedido/[id]` (acessível via link no comprovante e WhatsApp posterior).
7. Admin `/app/loja`:
   - Lista produtos
   - Criar/editar produto (vincular a item estoque ou produto exclusivo)
   - Lista pedidos com filtros (pagamento pendente, em separação, enviado, etc)
   - Detalhe pedido com botão "Confirmar pagamento" (libera para separação)
8. Mensagem WhatsApp automática quando pedido entra (Sprint 5 já permite).
9. SEO básico: meta tags, sitemap.xml, robots.txt, OG tags.

## Decisões já tomadas

- Loja anônima — sem conta de cliente no MVP.
- PIX QR estático gerado server-side (BR Code padrão Banco Central). Mais simples que integração Mercado Pago.
- Cliente faz upload do comprovante no checkout (imagem). Pedro vê e confirma manual.
- Frete: campo livre por produto (texto livre tipo "Retira na oficina" / "Entregue em até 2 dias úteis na cidade"). Sem cálculo automático no MVP.
- Quando produto vinculado a `item_estoque`: preço e quantidade vêm do estoque. Quando produto exclusivo (não vinculado): campos próprios.
- Pedido na loja é registrado em `pedidos_loja`. Quando Pedro confirma pagamento, opção "baixar estoque automaticamente" se itens vinculados.
- Carrinho do cliente: localStorage (anônimo). Backend só recebe na hora do checkout.

## Stack desta sprint

```bash
pnpm add qrcode                   # geração PIX QR
pnpm add @types/qrcode -D
pnpm add slugify                  # gerar slug do título
```

shadcn adicional:
```bash
npx shadcn@latest add carousel    # carrossel fotos produto
```

## Schema delta — `supabase/migrations/20260801000000_init_loja.sql`

```sql
-- Enums
create type produto_status as enum ('ativo', 'inativo', 'esgotado');
create type pedido_loja_status as enum (
  'aguardando_pagamento', 'pagamento_em_analise', 'pago',
  'em_separacao', 'enviado', 'retirado', 'cancelado'
);

-- Produtos
create table produtos_loja (
  id uuid primary key default gen_random_uuid(),
  item_estoque_id uuid references itens_estoque(id) on delete set null,    -- opcional
  titulo text not null,
  slug text not null unique,
  descricao text,
  fotos jsonb not null default '[]'::jsonb,                                -- array de storage paths
  preco numeric(12,2) not null check (preco >= 0),                         -- pode sobrescrever estoque se quiser
  preco_promocional numeric(12,2),
  estoque_manual int,                                                      -- usado se não tem item_estoque vinculado
  frete_info text,
  status produto_status not null default 'ativo',
  destaque bool not null default false,
  ordem_destaque int default 0,
  metadata jsonb default '{}'::jsonb,                                      -- tags, atributos
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_produtos_status on produtos_loja(status);
create index idx_produtos_destaque on produtos_loja(destaque, ordem_destaque) where status='ativo' and destaque=true;
create index idx_produtos_slug on produtos_loja(slug);
create index idx_produtos_titulo on produtos_loja using gin (to_tsvector('portuguese', titulo));
create trigger trg_produtos_atualizado_em before update on produtos_loja
  for each row execute function set_atualizado_em();

-- Pedidos
create table pedidos_loja (
  id uuid primary key default gen_random_uuid(),
  numero serial unique not null,
  cliente_nome text not null,
  cliente_telefone text not null,
  cliente_email text,
  cliente_endereco jsonb not null,                  -- { cep, rua, numero, bairro, cidade, complemento }
  valor_subtotal numeric(12,2) not null,
  valor_frete numeric(12,2) not null default 0,
  valor_total numeric(12,2) not null,
  metodo_pagamento text not null default 'pix',
  comprovante_url text,                             -- storage path do upload do cliente
  status pedido_loja_status not null default 'aguardando_pagamento',
  observacoes_cliente text,
  observacoes_internas text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  pago_em timestamptz,
  enviado_em timestamptz
);
create index idx_pedidos_status on pedidos_loja(status);
create index idx_pedidos_criado on pedidos_loja(criado_em desc);
create trigger trg_pedidos_loja_atualizado_em before update on pedidos_loja
  for each row execute function set_atualizado_em();

-- Itens do pedido
create table itens_pedido_loja (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos_loja(id) on delete cascade,
  produto_id uuid not null references produtos_loja(id) on delete restrict,
  titulo_snapshot text not null,                    -- snapshot do título no momento da compra
  preco_unitario numeric(12,2) not null,
  quantidade int not null check (quantidade > 0),
  subtotal numeric(12,2) generated always as (preco_unitario * quantidade) stored,
  criado_em timestamptz not null default now()
);
create index idx_itens_pedido on itens_pedido_loja(pedido_id);

-- Adicionar FK estoque (declarado provisório no Sprint 3)
alter table movimentacoes_estoque
  add constraint fk_mov_pedido_loja
  foreign key (pedido_loja_id) references pedidos_loja(id) on delete set null;

-- Função: helper para slug único
create or replace function gerar_slug_unico(p_titulo text, p_id uuid default null)
returns text as $$
declare
  v_slug text;
  v_count int;
  v_suffix int := 1;
begin
  v_slug := lower(regexp_replace(p_titulo, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'produto'; end if;

  loop
    select count(*) into v_count from produtos_loja
      where slug = v_slug and (p_id is null or id <> p_id);
    exit when v_count = 0;
    v_slug := v_slug || '-' || v_suffix;
    v_suffix := v_suffix + 1;
  end loop;
  return v_slug;
end;
$$ language plpgsql;

-- Storage bucket público pra fotos de produto + privado pra comprovantes
insert into storage.buckets (id, name, public) values
  ('loja-produtos', 'loja-produtos', true),                    -- fotos públicas (CDN)
  ('loja-comprovantes', 'loja-comprovantes', false);           -- comprovantes privados

create policy "loja_produtos_select_publico" on storage.objects
  for select to anon, authenticated using (bucket_id = 'loja-produtos');
create policy "loja_produtos_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'loja-produtos');
create policy "loja_produtos_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'loja-produtos');

-- Comprovantes: anon pode inserir (via server action com service_role idealmente),
-- mas no MVP autorizamos anon (cliente envia direto). Authenticated lê.
create policy "loja_comprovantes_anon_insert" on storage.objects
  for insert to anon with check (bucket_id = 'loja-comprovantes');
create policy "loja_comprovantes_auth_select" on storage.objects
  for select to authenticated using (bucket_id = 'loja-comprovantes');

-- RLS
alter table produtos_loja enable row level security;

-- SELECT público em ativos
create policy "produtos_loja_publico_select_ativos" on produtos_loja
  for select to anon, authenticated using (status = 'ativo');
-- Admin authenticated: tudo
create policy "produtos_loja_admin_all" on produtos_loja
  for all to authenticated using (true) with check (true);

alter table pedidos_loja enable row level security;
-- Inserts e selects do pedido individual via server action; nada de policy anon direta
create policy "pedidos_loja_admin_all" on pedidos_loja
  for all to authenticated using (true) with check (true);

-- Cliente acessa próprio pedido via slug/uuid (sem auth) — via server action que valida
-- Decisão: usamos server action com service_role para SELECT do pedido por id+telefone

alter table itens_pedido_loja enable row level security;
create policy "itens_pedido_loja_admin_all" on itens_pedido_loja
  for all to authenticated using (true) with check (true);
```

## Estrutura — delta

```
src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx                        # shell loja: header limpo, footer
│   │   ├── page.tsx                          # home: hero + destaques + categorias
│   │   ├── produtos/
│   │   │   └── page.tsx                      # catálogo paginado
│   │   ├── produto/[slug]/page.tsx
│   │   ├── carrinho/page.tsx                 # client-side state (localStorage)
│   │   ├── checkout/
│   │   │   ├── page.tsx                      # form dados + revisão
│   │   │   ├── pagamento/page.tsx            # mostra PIX QR + upload comprovante
│   │   │   └── actions.ts                    # criarPedido, uploadComprovante
│   │   ├── pedido/[id]/page.tsx              # status público (acessa via id+telefone)
│   │   ├── sitemap.ts                        # gerador dinâmico
│   │   └── robots.ts
│   ├── (admin)/app/loja/
│   │   ├── page.tsx                          # dashboard loja (vendas, pedidos pendentes)
│   │   ├── produtos/
│   │   │   ├── page.tsx
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── pedidos/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── configuracoes/page.tsx            # chave PIX, info banco, info entrega
│   └── api/loja/
│       └── webhook-pix/route.ts              # futuro: integração gateway PIX real (não MVP)
├── features/loja/
│   ├── actions.ts                            # createProduto, updateProduto, criarPedido,
│   │                                          # confirmarPagamento, atualizarStatusPedido, cancelarPedido
│   ├── queries.ts                            # listProdutosPublicos, getProdutoBySlug,
│   │                                          # listPedidosAdmin, getPedidoPublico
│   ├── schemas.ts, types.ts
│   ├── pix.ts                                # gerarPixBRCode (BR Code estático)
│   └── components/
│       ├── publico/
│       │   ├── hero.tsx
│       │   ├── produto-card.tsx
│       │   ├── produto-grid.tsx
│       │   ├── produto-galeria.tsx           # carousel fotos
│       │   ├── add-carrinho-button.tsx
│       │   ├── carrinho-store.ts             # zustand (apenas aqui — escopo carrinho)
│       │   ├── carrinho-drawer.tsx
│       │   ├── checkout-form.tsx
│       │   ├── pix-qr-display.tsx
│       │   ├── comprovante-upload.tsx
│       │   └── pedido-status-publico.tsx
│       └── admin/
│           ├── produto-form.tsx
│           ├── produtos-list.tsx
│           ├── pedido-card.tsx
│           ├── pedidos-list.tsx
│           ├── pedido-detalhe.tsx
│           └── confirmar-pagamento-dialog.tsx
└── shared/
    └── seo/
        ├── default-meta.ts                   # OG tags, twitter card
        └── product-jsonld.ts
```

## Tasks ordenadas

### Schema

1. Migration `20260801000000_init_loja.sql`.
2. Criar buckets `loja-produtos` (público) e `loja-comprovantes` (privado) via dashboard se SQL não criar automaticamente.
3. `supabase db push`. `pnpm db:gen`.

### Util PIX

4. `features/loja/pix.ts` — função `gerarPixBRCode({ chave, nome, cidade, valor, txid })` retorna string BR Code padrão BACEN. Test unitário com checksum válido.
5. Página renderiza QR via `qrcode` package.

### Carrinho client-side

6. `carrinho-store.ts` (zustand isolado) — persiste em localStorage. Operações: `addItem`, `removeItem`, `updateQty`, `clear`. Validação que produto ainda existe ativo na hora de checkout.

### Feature `loja` (publico)

7. Schemas zod (produto, pedido, item).
8. Queries públicas:
   - `listProdutosPublicos({ pagina, categoria?, faixaPreco?, busca? })`
   - `listProdutosDestaque(limit=8)`
   - `getProdutoBySlug(slug)` — apenas ativos
9. Server action `criarPedido({ cliente, itens })`:
   - Valida estoque (se produto vinculado a item_estoque) ou estoque_manual
   - Snapshot de preço atual
   - Cria `pedidos_loja` status `aguardando_pagamento`
   - Cria `itens_pedido_loja` rows
   - Retorna `{ pedidoId, valorTotal, pix: { qrText, chave } }`
   - Roda via service_role (anon não tem INSERT direto)
10. Server action `uploadComprovante(pedidoId, file)`:
    - Upload pra `loja-comprovantes/{pedidoId}.ext`
    - Atualiza `pedidos_loja.comprovante_url` + status `pagamento_em_analise`
11. Componentes públicos: `Hero`, `ProdutoCard`, `ProdutoGrid`, `ProdutoGaleria` (carousel), `AddCarrinhoButton`, `CarrinhoDrawer`, `CheckoutForm`, `PixQrDisplay`, `ComprovanteUpload`, `PedidoStatusPublico`.
12. Páginas públicas listadas na estrutura.
13. SEO:
    - `<head>` por página com Next Metadata API: title, description, OG, Twitter, JSON-LD product
    - `sitemap.ts` gerando rotas dinâmicas dos produtos ativos
    - `robots.ts`

### Feature `loja` (admin)

14. Schemas/queries admin: `listProdutosAdmin`, `listPedidosAdmin(filters)`, `getPedidoDetalhe`.
15. Actions admin: `createProduto`, `updateProduto`, `softDeleteProduto`, `confirmarPagamento(pedidoId, baixarEstoque=true)`, `atualizarStatusPedido(pedidoId, novoStatus)`, `cancelarPedido(pedidoId, motivo)`.
16. `confirmarPagamento` quando `baixarEstoque=true` e itens têm `item_estoque_id`: chama `aplicar_movimentacao_estoque(item_id, 'saida_loja', quantidade, ...)` pra cada.
17. Componentes admin: `ProdutoForm` (com upload múltiplo de fotos, vincular item estoque opcional), `ProdutosList`, `PedidoCard`, `PedidosList`, `PedidoDetalhe`, `ConfirmarPagamentoDialog`.
18. Páginas admin listadas.

### Integração WhatsApp (Sprint 5)

19. Quando `criarPedido` finaliza, dispara mensagem WhatsApp pra cliente com link `/pedido/[id]?tel=...` (passa telefone que ele forneceu).
20. Pedro recebe notificação interna (toast quando logado / opcional push depois).
21. Adicionar template `pedido_loja_recebido` em `whatsapp_templates`.

### Bottom-nav

22. Adicionar item "Loja" no menu "Mais" do bottom-nav admin (vai pra `/app/loja`).

### Dashboard admin

23. Card "Pedidos pendentes" no dashboard principal.

### Domínio

24. Configurar `pedrored.com.br` (custom domain Vercel). Apex domain aponta pro Vercel.
25. Sem subdomínio admin no MVP — admin acessa em `pedrored.com.br/login` + `pedrored.com.br/app`. Loja em `pedrored.com.br/`.

### Testes

26. Vitest: `gerarPixBRCode` produz BR Code com checksum válido; carrinho `addItem`/`removeItem` consistente.
27. Playwright:
    - Visitar home anon, ver produto, adicionar carrinho
    - Checkout, gerar PIX QR
    - Upload comprovante mock
    - Acessar `/pedido/[id]` como cliente
    - Admin confirma pagamento, baixa estoque
    - Sem caixa/admin: tentar acessar `/app/loja` → redireciona login

### Documentação

28. Atualizar `data-model.md`, `deploy.md` (domínio, buckets), `00-overview.md` Sprint 6 → 🟢.

## Critical files

- `supabase/migrations/20260801000000_init_loja.sql`
- `src/features/loja/**`
- `src/app/(public)/**`
- `src/app/(admin)/app/loja/**`

## Skills

- `frontend-design:frontend-design` (recomendado — loja precisa visual de qualidade)
- `superpowers:writing-plans`
- `superpowers:test-driven-development` (PIX gen, carrinho store)
- `superpowers:verification-before-completion`

## Verificação

### Automatizada

- [ ] typecheck/lint/test/e2e/build verdes
- [ ] Migration aplica
- [ ] PIX BR Code validador externo aceita o código gerado (`gerarPixBRCode` unit)
- [ ] Carrinho store testado

### Manual (dev)

- [ ] Home `/` carrega sem JS bloqueante (Lighthouse ≥ 90 perf)
- [ ] SEO: sitemap.xml lista produtos, robots.txt presente, OG tags renderizam
- [ ] Adicionar 3 produtos via admin (com fotos)
- [ ] Visitar anon, ver no catálogo
- [ ] Adicionar 2 ao carrinho, checkout completo, gerar PIX QR (escanear com app Banco do Brasil/Itau valida)
- [ ] Upload comprovante anônimo funciona (políticas storage)
- [ ] Admin vê pedido, confirma pagamento, estoque baixa (se vinculado)
- [ ] Acessar `/pedido/[id]?tel=...` mostra status do pedido

### Manual (Pedro)

- [ ] Pedro cadastra 10 produtos reais com fotos
- [ ] Divulga link da loja no WhatsApp pra cliente
- [ ] Cliente compra real → Pedro vê pedido, confirma → estoque baixa
- [ ] Pedro confirma "agora vendo online com facilidade"

## Definition of Done

1. Verificação completa
2. `00-overview.md` Sprint 6 = ✅
3. Domínio `pedrored.com.br` ativo
4. PR mergeado, deploy verde
5. Pedro validou (com pedido real fim a fim)

## Fora de escopo

- Conta de cliente / login na loja
- Múltiplos métodos de pagamento (só PIX no MVP — cartão fica pra futuro)
- Integração com gateway PIX real (Mercado Pago, PagSeguro) — usamos QR estático manual
- Cálculo de frete por CEP (Correios) — campo livre por produto
- Cupons / descontos / promoções automáticas (campo `preco_promocional` existe mas usado manual)
- Programa de afiliados próprio
- Avaliações de produto
- Wishlist
- App mobile separado (PWA cobre)
- Multi-loja / multi-vendedor

## Bloqueios

(adicione — dúvida: precisamos consultar CPF do cliente? Decisão MVP: não, telefone basta)

## Progresso

**Fases entregues:**
- ✅ 6A — Migration `20260801000000_init_loja.sql` aplicada (produtos_loja, pedidos_loja, itens_pedido_loja, função `gerar_slug_unico`, buckets storage `loja-produtos`/`loja-comprovantes`, RLS, FK `movimentacoes_estoque.pedido_loja_id`)
- ✅ 6B — `qrcode` + `slugify` instalados. `features/loja/pix.ts` com gerador BR Code (CRC16-CCITT) + 11 testes TDD verdes
- ✅ 6C — Carrinho client-side (`useSyncExternalStore` + localStorage) com 10 testes TDD verdes
- ✅ 6D — `src/features/loja/{types,schemas,queries}.ts` + helper `src/lib/supabase/service.ts` (`createServiceClient`) + 13 testes
- ✅ 6E — `src/app/(public)/checkout/actions.ts` (criarPedido via service_role + uploadComprovante)
- ✅ 6F — `src/features/loja/actions.ts` (CRUD produto com slug, upload/remove fotos, confirmarPagamento com baixa de estoque via RPC, status changer, cancelarPedido)
- ✅ 6G — Layout público + páginas (`/`, `/produtos`, `/produto/[slug]`, `/carrinho`, `/checkout`, `/checkout/pagamento`, `/pedido/[id]`) + componentes (Hero, ProdutoCard/Grid/Galeria, AddCarrinhoButton, CheckoutForm, PixQrDisplay com `qrcode.toCanvas`, ComprovanteUpload, PedidoStatusBadge, CarrinhoIndicator)
- ✅ 6H — Admin loja (`/app/loja/{,produtos/{,novo,[id]},pedidos/{,[id]},configuracoes}`) + componentes (ProdutoForm com upload de fotos, ProdutosList, PedidoCard/List, PedidoDetalhe, ConfirmarPagamentoDialog, StatusChanger). Comprovante exibido via signed URL (TTL 1h).
- ✅ 6I — `(public)/sitemap.ts` + `robots.ts` (descobertos via Next Metadata API), `/app/mais` criada (atalho pra Loja + outros módulos), dashboard ganha card "Pedidos pendentes (loja)", `.env.local.template` ganha PIX_* + NEXT_PUBLIC_SITE_URL com placeholders documentados, JSON-LD Product no `/produto/[slug]`. TODOs WhatsApp (`TODO(sprint-5)`) plantados em `criarPedido`, `uploadComprovante`, `confirmarPagamento`.
- ✅ 6J — `e2e/sprint-06-store.spec.ts` (3 cenários smoke); docs atualizados (data-model, deploy, overview)
- ✅ 6K (suplemento 2026-05-11) — Loja na sidebar desktop. Migration `20260930000000_loja_sob_encomenda.sql` adiciona `produtos_loja.somente_sob_encomenda` + check `produtos_loja_sob_encomenda_sem_estoque` + trigger `trg_itens_estoque_loja_status` (sincroniza `produtos_loja.status` quando saldo cruza zero). `criarPedido` agora bloqueia checkout quando produto vinculado tem saldo insuficiente; produtos sob encomenda passam livres. Form admin esconde combobox de estoque quando flag está ligada. Vitrine pública mostra badge "Sob encomenda" ou "Últimas X unidades" (`SALDO_BAIXO_THRESHOLD = 3`); JSON-LD usa `BackOrder` quando aplicável. Testes de integração `features/loja/integration.test.ts` (7/7 contra DB real) cobrem constraint, trigger nas 3 transições, validação de saldo no checkout. Vitest ganhou alias `server-only` + mock `next/cache` para permitir importar Server Actions.
- ✅ 6L (polimento 2026-05-12, branch `sprint-06-polish`) — Hero do desktop reescrito como split panel (texto esquerda + foto Pedro contida 4:5 à direita) — mobile mantém full-bleed. Header agora é `sticky top-0 z-40` com `bg-neutral-950/90 backdrop-blur` + ícones YouTube/Instagram. Nova seção "Pedro no YouTube" entre Destaques e Mais produtos: server-side fetch de `youtube.com/feeds/videos.xml` (sem API key, cache 1h) parseado por regex em `features/loja/youtube.ts`, com fallback `[]` em qualquer falha. Footer ampliado pra 3 colunas (marca / oficina com endereço em São Luís → Google Maps / contato YT+IG+WA) + linha inferior `© ano PedroRed` + crédito "Feito por Vibe Surf Dev → vibesurfdev.com". Constantes centralizadas em `features/loja/contato.ts`. `YT_CHANNEL_ID` adicionado a `.env.local.template` e `docs/architecture/deploy.md`. Novo teste `features/loja/youtube.test.ts` (7/7) com fixture real do canal `@PEDROredtsi`.

**Verificação automatizada (CI):**
- [x] typecheck verde
- [x] lint verde
- [x] vitest schemas (13 loja + outros = 144 total passing)
- [x] vitest PIX (11/11)
- [x] vitest carrinho store (10/10)
- [x] migrations aplicam em DB remoto

**Itens com placeholder/TODO (Pedro precisa configurar):**
- `PIX_CHAVE`, `PIX_NOME_BENEFICIARIO`, `PIX_CIDADE` — quando preencher em Vercel Settings, QR PIX vira válido pra pagamento real
- `NEXT_PUBLIC_SITE_URL` — quando tiver domínio próprio (pedrored.com.br); sem definir, sitemap/robots apontam pro vercel.app
- Notificações WhatsApp (Sprint 5) — atualmente Pedro vê pedidos só ao abrir o app

**Manual (Pedro):** pendente — Pedro vai testar em batch (com Sprint 3) em produção.

## Referências

- BR Code (PIX): https://www.bcb.gov.br/estabilidadefinanceira/spb_padroes
- qrcode npm: https://www.npmjs.com/package/qrcode
- Next Metadata API: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- Slug generation: https://github.com/simov/slugify
