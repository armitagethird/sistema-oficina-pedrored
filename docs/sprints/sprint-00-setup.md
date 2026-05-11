# Sprint 0 — Setup

> **Self-contained.** Esta sprint pode ser executada por uma sessão Claude que não viu nada antes — o documento contém todo contexto necessário.
>
> Se entrou aqui direto: leia também `CLAUDE.md` raiz, `docs/00-overview.md`, `docs/architecture/stack.md` e `docs/architecture/data-model.md`.

## Status

✅ **Validada em 2026-05-11 por Romero (proxy do Pedro).** Deploy em produção: https://sistema-oficina-pedrored.vercel.app/

## Contexto rápido

Sistema web Next.js para Pedro (mecânico VW). Esta sprint estabelece a fundação: projeto Next inicializado, Supabase conectado, autenticação funcional, shell mobile-first navegável (vazio), schema base com `clientes` + `veiculos` + catálogo VW, deploy Vercel. Sem essa fundação, nenhuma outra sprint roda.

## Pré-requisitos

- [ ] Conta GitHub (repositório novo `pedrored/sistema-oficina-pedrored` ou similar)
- [ ] Conta Vercel conectada ao GitHub
- [ ] Conta Supabase com projeto criado (region `sa-east-1`)
- [ ] Node 20 LTS + pnpm 9 instalados localmente
- [ ] Supabase CLI instalada (`brew install supabase/tap/supabase` ou via npm)
- [ ] Variáveis Supabase coletadas (URL, anon key, service role key)

Se algum item faltar, **pare e peça ao Romero** para resolver antes de seguir.

## Objetivo

Ao final desta sprint:

1. Pedro abre URL no celular dele, faz login com email + senha que Romero cadastrou via Supabase dashboard.
2. Vê dashboard vazio com bottom-nav (Dashboard, OS, Estoque, Agenda, Mais).
3. Consegue alternar tema claro/escuro.
4. Consegue instalar como app no celular (PWA — Adicionar à tela inicial).
5. Tabelas `clientes`, `veiculos`, `vw_modelos` existem no Supabase com RLS ativo.
6. README + docs permitem outro dev rodar local em <10 minutos.

## Decisões já tomadas (não revisitar)

- Stack: Next.js 15 App Router + TypeScript + Tailwind v4 + shadcn/ui + Supabase (todas em `docs/architecture/stack.md` com versões).
- Hospedagem: Vercel free.
- Single-user (só Pedro). Sem signup público.
- Mobile-first absoluto. Bottom-nav é navegação primária.
- Idioma UI pt-BR. Identificadores em inglês exceto entidades de domínio.
- Catálogo VW híbrido (lista pré-cadastrada + permite custom).
- Estrutura: route groups `(admin)` protegida + `(public)` para loja (loja entra Sprint 6, mas grupo já existe pra organizar).

## Stack desta sprint (dependências a instalar)

```bash
# Core
pnpm add next@15 react@19 react-dom@19
pnpm add -D typescript @types/node @types/react @types/react-dom

# UI
pnpm add tailwindcss@^4 @tailwindcss/postcss
pnpm add lucide-react next-themes sonner vaul
# shadcn/ui via CLI: npx shadcn@latest init && npx shadcn@latest add ...

# Forms / validation
pnpm add zod react-hook-form @hookform/resolvers

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D supabase

# PWA
pnpm add @ducanh2912/next-pwa

# Lint / format
pnpm add -D eslint eslint-config-next prettier prettier-plugin-tailwindcss

# Tests
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D @playwright/test
```

## Schema delta — migrations a criar

### `supabase/migrations/20260510000000_init_clientes_veiculos.sql`

```sql
-- Trigger genérico de atualizado_em
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

-- Catálogo VW (seed depois)
create table vw_modelos (
  id uuid primary key default gen_random_uuid(),
  modelo text not null,
  motor text not null,
  combustivel text not null default 'flex',
  ano_inicio int,
  ano_fim int,
  criado_em timestamptz not null default now(),
  unique (modelo, motor)
);
create index idx_vw_modelos_modelo on vw_modelos(modelo);

-- Clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  cpf text,
  endereco jsonb,           -- { rua, numero, bairro, cidade, cep, complemento }
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);
create index idx_clientes_nome on clientes(nome) where deletado_em is null;
create index idx_clientes_telefone on clientes(telefone) where deletado_em is null;
create trigger trg_clientes_atualizado_em before update on clientes
  for each row execute function set_atualizado_em();

-- Veículos
create table veiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  modelo_id uuid references vw_modelos(id) on delete set null,
  modelo_custom text,                         -- preenchido se modelo_id IS NULL
  motor text,                                 -- '1.0 MSI', '1.4 TSI', etc.
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
create index idx_veiculos_cliente on veiculos(cliente_id) where deletado_em is null;
create index idx_veiculos_placa on veiculos(placa) where deletado_em is null;
create trigger trg_veiculos_atualizado_em before update on veiculos
  for each row execute function set_atualizado_em();

-- RLS — single-user authenticated
alter table vw_modelos enable row level security;
create policy "vw_modelos_authenticated_all" on vw_modelos
  for all to authenticated using (true) with check (true);

alter table clientes enable row level security;
create policy "clientes_authenticated_all" on clientes
  for all to authenticated using (true) with check (true);

alter table veiculos enable row level security;
create policy "veiculos_authenticated_all" on veiculos
  for all to authenticated using (true) with check (true);
```

### `supabase/migrations/20260510000001_seed_vw_modelos.sql`

Catálogo VW 2010-2026 (linha brasileira). Lista mínima a popular:

```sql
insert into vw_modelos (modelo, motor, combustivel, ano_inicio, ano_fim) values
-- Linha MSI (aspirado)
('Gol', '1.0 MSI', 'flex', 2014, 2024),
('Gol', '1.6 MSI', 'flex', 2014, 2024),
('Voyage', '1.0 MSI', 'flex', 2014, 2023),
('Voyage', '1.6 MSI', 'flex', 2014, 2023),
('Saveiro', '1.6 MSI', 'flex', 2014, null),
('Polo', '1.6 MSI', 'flex', 2017, null),
('Virtus', '1.6 MSI', 'flex', 2018, null),
('T-Cross', '1.6 MSI', 'flex', 2019, null),
('Up!', '1.0 MPI', 'flex', 2014, 2021),
-- Linha TSI (turbo)
('Polo', '1.0 TSI', 'flex', 2017, null),
('Polo GTS', '1.4 TSI', 'flex', 2018, 2022),
('Virtus', '1.0 TSI', 'flex', 2018, null),
('Virtus GTS', '1.4 TSI', 'flex', 2018, 2022),
('T-Cross', '1.0 TSI', 'flex', 2019, null),
('T-Cross', '1.4 TSI', 'flex', 2019, null),
('Nivus', '1.0 TSI', 'flex', 2020, null),
('Taos', '1.4 TSI', 'flex', 2021, null),
('Taos', '250 TSI', 'flex', 2021, null),
('Tiguan Allspace', '1.4 TSI', 'flex', 2018, null),
('Tiguan Allspace', '2.0 TSI', 'gasolina', 2018, null),
('Jetta', '250 TSI', 'gasolina', 2019, null),
('Jetta GLI', '350 TSI', 'gasolina', 2019, null),
('Amarok', '2.0 TDI', 'diesel', 2014, null),
('Amarok V6', '3.0 V6 TDI', 'diesel', 2018, null);
```

(Ajustar/completar conforme conhecimento atualizado da linha VW Brasil.)

## Estrutura de pastas — estado final do Sprint 0

```
sistema-oficina-pedrored/
├── CLAUDE.md
├── README.md                              # criado nesta sprint
├── docs/                                  # já criado
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts                     # se necessário (Tailwind v4 usa CSS-first)
├── components.json                        # shadcn config
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.example
├── .env.local                             # gitignored
├── public/
│   ├── manifest.webmanifest
│   ├── icons/icon-192.png
│   ├── icons/icon-512.png
│   ├── icons/apple-touch-icon.png
│   └── favicon.ico
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260510000000_init_clientes_veiculos.sql
│   │   └── 20260510000001_seed_vw_modelos.sql
│   └── seed.sql                           # (vazio por ora; seed dos modelos vai na migration)
├── src/
│   ├── middleware.ts                      # protege /app/*, redireciona /login
│   ├── app/
│   │   ├── globals.css                    # Tailwind v4 import + tokens
│   │   ├── layout.tsx                     # html, theme provider, sonner
│   │   ├── page.tsx                       # placeholder loja (Sprint 6)
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts                 # server action signIn
│   │   ├── auth/
│   │   │   └── callback/route.ts          # callback Supabase
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                 # shell autenticado: header + bottom-nav + sidebar desktop
│   │   │   └── app/
│   │   │       └── page.tsx               # dashboard placeholder
│   │   └── (public)/
│   │       └── layout.tsx                 # shell loja vazio (preenche Sprint 6)
│   ├── components/
│   │   ├── ui/                            # shadcn (button, card, input, label, dialog, sheet, drawer, dropdown-menu, table, tabs, sonner)
│   │   ├── shell/
│   │   │   ├── admin-header.tsx
│   │   │   ├── bottom-nav.tsx
│   │   │   ├── sidebar-desktop.tsx
│   │   │   └── theme-toggle.tsx
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts                  # createBrowserClient
│   │       ├── server.ts                  # createServerClient (cookies)
│   │       ├── middleware.ts              # updateSession helper
│   │       └── database.types.ts          # gerado por `pnpm db:gen`
│   ├── shared/
│   │   ├── format/
│   │   │   ├── money.ts                   # formatBRL, parseBRL
│   │   │   └── date.ts                    # formatDate, formatDateTime (pt-BR + Sao_Paulo)
│   │   └── hooks/
│   │       └── use-media-query.ts         # detecta mobile pra alternar bottom-nav vs sidebar
│   └── features/                          # vazio nesta sprint, só estrutura
└── .vscode/
    └── settings.json                      # formatOnSave, prettier default
```

## Tasks ordenadas

1. **Inicializar Next 15.**
   ```bash
   pnpm create next-app@latest . --ts --tailwind --app --src-dir --import-alias "@/*" --no-eslint
   ```
   Ajustar manualmente caso o create-next-app não aceite `.` num diretório vazio (usar nome temporário e mover).

2. **Configurar pnpm como obrigatório:** adicionar `packageManager: "pnpm@9.x.x"` em `package.json` + `engines: { "node": "20.x", "pnpm": "9.x" }`.

3. **Adicionar dependências** listadas em "Stack desta sprint".

4. **Configurar ESLint v9 + Prettier.** `eslint.config.mjs` flat config + `.prettierrc.mjs` com `prettier-plugin-tailwindcss`.

5. **Configurar Tailwind v4.** `src/app/globals.css`:
   ```css
   @import "tailwindcss";
   @plugin "tailwindcss-animate";

   :root { /* tokens shadcn */ }
   .dark { /* tokens shadcn */ }
   ```

6. **Inicializar shadcn.**
   ```bash
   npx shadcn@latest init -d   # default style, slate, CSS variables
   npx shadcn@latest add button card input label dialog sheet drawer dropdown-menu table tabs sonner badge avatar separator
   ```

7. **Configurar Supabase CLI local.**
   ```bash
   supabase init
   supabase link --project-ref <project-ref>
   ```
   Editar `supabase/config.toml` se necessário.

8. **Escrever migrations** (conteúdo acima) em `supabase/migrations/`.

9. **Aplicar migrations.**
   ```bash
   supabase db push
   ```
   Verificar no dashboard Supabase que tabelas e seed apareceram.

10. **Gerar tipos TypeScript.**
    ```bash
    supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
    ```
    Adicionar script `db:gen` ao `package.json`.

11. **Implementar `src/lib/supabase/{client,server,middleware}.ts`** seguindo doc oficial Supabase SSR para Next App Router (https://supabase.com/docs/guides/auth/server-side/nextjs).

12. **Implementar `src/middleware.ts`.** Usa `updateSession` do helper acima. Redireciona não-autenticado em `/app/*` para `/login`.

13. **Implementar `/login`.** Form simples (email + senha), server action chama `supabase.auth.signInWithPassword`, redireciona para `/app`. Tratar erro com `sonner` toast.

14. **Implementar `/auth/callback/route.ts`** (boilerplate Supabase pra trocar code por session em fluxos de magic link futuros — manter pronto).

15. **Implementar `theme-provider` + `theme-toggle`** com `next-themes`.

16. **Implementar shell admin:**
    - `(admin)/layout.tsx` com `<AdminHeader/>` no topo + `<BottomNav/>` fixo bottom em mobile + `<SidebarDesktop/>` em ≥md.
    - Bottom-nav: ícones Lucide para Dashboard (Home), OS (FileText), Estoque (Package), Agenda (Calendar), Mais (Menu — abre Sheet com opções secundárias).
    - Tema toggle no header.
    - Dropdown avatar com "Sair" (server action signOut).

17. **Implementar shell público vazio.** `(public)/layout.tsx` minimalista, `page.tsx` raiz mostra "PedroRed Store em breve".

18. **Configurar PWA.**
    - `public/manifest.webmanifest` com `name`, `short_name`, `theme_color`, `background_color`, ícones 192/512.
    - Gerar ícones (placeholder com letra "P" vermelha sobre fundo branco até logo definitivo).
    - Configurar `@ducanh2912/next-pwa` em `next.config.ts`.

19. **Helpers compartilhados:**
    - `src/shared/format/money.ts` — `formatBRL(value: string | number)` e `parseBRL(input: string)`.
    - `src/shared/format/date.ts` — `formatDate`, `formatDateTime`, `formatRelative` em pt-BR/Sao_Paulo.
    - `src/shared/hooks/use-media-query.ts` — hook `useIsMobile()` (≤768px).

20. **Configurar Vitest + Playwright.** Scripts no `package.json`. Configs mínimas. Um teste de smoke por ferramenta:
    - Vitest: `formatBRL(1234.5)` retorna `"R$ 1.234,50"`.
    - Playwright: abre `/login`, vê título "Entrar". (Sem login real ainda — auth real testa manual.)

21. **`.env.example`** com chaves vazias documentadas. **`.env.local`** preenchido com credenciais Supabase.

22. **Criar conta Pedro no Supabase Dashboard** → Authentication → Add user (email + senha). Confirmar manualmente.

23. **Configurar `vercel.json` mínimo** (apenas se necessário — Next 15 + Vercel auto-detecta tudo; criar só se precisarmos `regions` pra `gru1`).

24. **Push pra GitHub** + **conectar Vercel** + **adicionar env vars** no painel Vercel.

25. **Deploy.** Verificar URL `pedrored.vercel.app` funcionando.

26. **README.md** raiz: badges, descrição curta, link `docs/00-overview.md`, comandos `pnpm install`, `pnpm dev`, `pnpm build`, fluxo de migrations.

27. **Atualizar `docs/architecture/data-model.md`** seção "Estado atual" — listar tabelas criadas com FK e RLS ativo.

28. **Atualizar `docs/00-overview.md`** — Sprint 0 → 🟢.

## Critical files

- `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`
- `src/app/layout.tsx`, `src/app/(admin)/layout.tsx`, `src/app/(public)/layout.tsx`
- `src/app/login/page.tsx`, `src/app/login/actions.ts`
- `src/lib/supabase/{client,server,middleware,database.types}.ts`
- `src/middleware.ts`
- `src/components/shell/{admin-header,bottom-nav,sidebar-desktop,theme-toggle}.tsx`
- `src/components/theme-provider.tsx`
- `src/shared/format/{money,date}.ts`
- `supabase/migrations/20260510000000_init_clientes_veiculos.sql`
- `supabase/migrations/20260510000001_seed_vw_modelos.sql`
- `public/manifest.webmanifest` + ícones
- `.env.example`
- `README.md`

## Skills a invocar nesta sprint

- `superpowers:writing-plans` (opcional) — gera plano executável passo a passo.
- `superpowers:test-driven-development` — para os helpers de formatação (`formatBRL`, etc).
- `superpowers:verification-before-completion` — antes de declarar terminada.
- `andrej-karpathy-skills:karpathy-guidelines` — pra evitar over-engineering nos shells.

## Verificação

### Automatizada

- [ ] `pnpm install` sem erro
- [ ] `pnpm typecheck` passa
- [ ] `pnpm lint` passa
- [ ] `pnpm test` passa (smoke vitest)
- [ ] `pnpm e2e` passa (smoke playwright)
- [ ] `pnpm build` passa
- [ ] CI GitHub Actions verde (workflow `.github/workflows/ci.yml` mínimo: install + typecheck + lint + test + build)

### Manual (dev)

- [ ] `pnpm dev` sobe sem erro em `http://localhost:3000`
- [ ] `/` mostra placeholder loja sem erros
- [ ] `/login` aceita credenciais válidas e redireciona pra `/app`
- [ ] `/app` (logado) mostra dashboard placeholder com bottom-nav em mobile (375×667 no DevTools) e sidebar em desktop (1280×800)
- [ ] Tema toggle alterna claro/escuro persistindo
- [ ] Tabelas existem no Supabase: `vw_modelos` (24+ rows), `clientes` (0), `veiculos` (0)
- [ ] RLS ativo: tentar query sem auth via REST falha
- [ ] Tipos `Database` importados e disponíveis

### Manual (Pedro)

- [ ] Pedro abre `pedrored.vercel.app/login` no celular dele (Android Chrome ou iPhone Safari)
- [ ] Loga com credenciais que Romero passou
- [ ] Vê dashboard, navega bottom-nav (todos itens placeholder OK)
- [ ] Instala como app via "Adicionar à tela inicial"
- [ ] Abre app instalado, sessão persiste
- [ ] Confirma "deu certo" via WhatsApp

## Definition of Done

Sprint 0 é ✅ quando:

1. Toda checkbox da seção Verificação está marcada.
2. `docs/00-overview.md` Sprint 0 = ✅.
3. `docs/architecture/data-model.md` "Estado atual" lista clientes, veiculos, vw_modelos.
4. PR mergeado em `main`, deploy Vercel verde.
5. Pedro confirmou validação por WhatsApp ao Romero.

## Fora de escopo (explícito)

- CRUD de clientes/veículos via UI (vai pro Sprint 1).
- Qualquer página além de `/login`, `/app` (placeholder), `/` (placeholder loja).
- Lógica de OS, estoque, agenda etc.
- Roles/permissões além de "logado vs não-logado".
- Logo final do PedroRed (placeholder por ora).
- CI elaborado (apenas básico).

## Bloqueios conhecidos

Nenhum bloqueio crítico. Desvios documentados em "Progresso" abaixo.

## Progresso

**Encerrada em 2026-05-11.** 9 commits atômicos no `main`, deploy Vercel verde, validado por Romero (stakeholder agindo por Pedro).

### Desvios de spec

- **Next 16.2.6** (não Next 15) — release atual; `create-next-app` instalou. Stack doc atualizado.
- **Node 24.x LTS** (não 20) — Node 24 já era LTS na data do Sprint. Stack doc atualizado.
- **`src/proxy.ts`** (não `src/middleware.ts`) — Next 16 renomeou a convenção.
- **Service Worker adiado** — `@ducanh2912/next-pwa` usa webpack plugin, incompatível com Turbopack (default no Next 16). Manifest + ícones já bastam pra PWA "Add to Home". SW reavaliado em sprint futura com `@serwist/next` se cache offline virar necessidade.
- **ESLint flat config sem `eslint-config-next` extends** — circular ref bug com ESLint 9 flat; usei `@next/eslint-plugin-next` direto.
- **Catálogo VW seed**: 24 modelos aplicados (Gol, Voyage, Saveiro, Polo, Virtus, T-Cross, Up!, Nivus, Taos, Tiguan Allspace, Jetta, Amarok + variantes MSI/TSI/TDI).
- **PWA ícones placeholder** (PNG vermelho sólido com letra "P" branca, gerados via System.Drawing). Substituir quando logo definitivo do PedroRed estiver pronto.

### Endpoints

| Local | Vercel |
|-------|--------|
| http://localhost:3000 | https://sistema-oficina-pedrored.vercel.app/ |

### Próxima sprint

**Sprint 1 — Core OS.** Bootstrap Sprint 1 ao iniciar nova sessão (CLAUDE.md raiz).

## Referências

- Supabase SSR Next: https://supabase.com/docs/guides/auth/server-side/nextjs
- shadcn install: https://ui.shadcn.com/docs/installation/next
- next-pwa fork: https://github.com/DuCanhGH/next-pwa
- Tailwind v4: https://tailwindcss.com/docs/v4-beta
