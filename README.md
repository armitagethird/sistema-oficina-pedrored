# Sistema Oficina PedroRed

Sistema web mobile-first para gestão da oficina mecânica PedroRed (linha Volkswagen TSI/MSI).

**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Auth + Storage) · PWA · Vitest · Playwright.

## Quickstart

Pré-requisitos: Node 24 LTS, pnpm 9, Supabase CLI (instalada como dev dep).

```bash
pnpm install
Copy-Item .env.local.template .env.local   # preencher credenciais Supabase
pnpm db:gen                                 # gera tipos do Supabase
pnpm dev                                    # http://localhost:3000
```

## Comandos

| Comando         | O que faz                                    |
| --------------- | -------------------------------------------- |
| `pnpm dev`      | Servidor local em :3000 (Turbopack)          |
| `pnpm build`    | Build de produção                            |
| `pnpm typecheck`| `tsc --noEmit`                               |
| `pnpm lint`     | ESLint flat config                           |
| `pnpm test`     | Vitest unit tests (helpers + hooks)          |
| `pnpm e2e`      | Playwright E2E (mobile + desktop)            |
| `pnpm db:gen`   | Gera tipos do Supabase remoto                |
| `pnpm db:migrate` | Aplica migrations remotas (`supabase db push`) |
| `pnpm format`   | Prettier write                               |

## Estrutura

- `src/app/` — App Router (Next.js). Route groups `(admin)` protegido + `(public)` para loja anônima.
- `src/components/ui/` — shadcn/ui (New York, Slate). Copiados sob demanda via `pnpm exec shadcn add ...`.
- `src/components/shell/` — header, bottom-nav, sidebar-desktop, theme-toggle.
- `src/features/{ordens,clientes,veiculos,...}/` — vazio nesta sprint, features-first daqui em diante.
- `src/lib/supabase/` — clients SSR (browser, server, middleware) + tipos gerados.
- `src/shared/` — helpers de formatação (BRL, datas pt-BR/Sao_Paulo) e hooks utilitários.
- `supabase/migrations/` — SQL versionado, fonte da verdade do schema.

## Documentação

Toda documentação canônica vive em `docs/`. Leia primeiro:

- `docs/00-overview.md` — visão mestre + roadmap por sprint
- `docs/architecture/stack.md` — versões e justificativas
- `docs/architecture/data-model.md` — schema vivo
- `docs/sprints/sprint-XX-*.md` — instruções self-contained de cada sprint

Para sessões Claude: o arquivo `CLAUDE.md` na raiz é o bootstrap obrigatório.

## Credenciais e segredos

- `.env.local` é gitignored — nunca commite.
- `.env.local.template` é versionado e DEVE permanecer com placeholders vazios.
- Service role key bypassa RLS — apenas server-side.
