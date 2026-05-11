# Sprint 0 — Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabelecer fundação do sistema PedroRed — Next.js 15 inicializado, Supabase conectado, autenticação funcional, shell mobile-first navegável, schema base com `clientes` + `veiculos` + `vw_modelos`, PWA instalável, deploy Vercel verde.

**Architecture:** Monolito Next.js App Router único. Route groups `(admin)` protegido + `(public)` para loja anônima futura. Auth via Supabase SSR (cookies). Tailwind v4 + shadcn/ui. Mobile-first com bottom-nav. Schema PostgreSQL com RLS via Supabase. Tipos TS gerados via Supabase CLI.

**Tech Stack:** Next.js 15 · React 19 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · @supabase/ssr · @ducanh2912/next-pwa · zod · react-hook-form · vitest · @playwright/test · pnpm 9.

**Spec canônico:** `docs/sprints/sprint-00-setup.md`. Este plano é a camada bite-sized executável do spec.

**Working directory:** Todos os caminhos abaixo são relativos a `sistema-oficina-pedrored/`. O diretório raiz absoluto é `F:\Developments\pedro-red-sistema-oficina\sistema-oficina-pedrored\`.

**Credenciais externas a coletar antes de começar Task 1:**
- `<SUPABASE_PROJECT_REF>` — referência do projeto Supabase (ex: `abcdefghijklmno`)
- `<SUPABASE_URL>` — URL completa do projeto (ex: `https://abcdefghijklmno.supabase.co`)
- `<SUPABASE_ANON_KEY>` — anon key (eyJ...)
- `<SUPABASE_SERVICE_ROLE_KEY>` — service role key (eyJ...)
- `<GITHUB_REPO_URL>` — URL do repositório remoto (ex: `https://github.com/romerosaraiva/sistema-oficina-pedrored`)
- `<EMAIL_PEDRO>` — email do Pedro pra criar a conta no Supabase Auth
- `<SENHA_INICIAL_PEDRO>` — senha temporária (Pedro troca depois via fluxo de reset)

---

## File Structure

### Configs (raiz)
- `package.json` — scripts, deps, engines, packageManager
- `pnpm-lock.yaml` — gerado
- `tsconfig.json` — strict TS, path alias `@/*`
- `next.config.ts` — wrapper com `next-pwa`
- `postcss.config.mjs` — Tailwind v4 plugin
- `eslint.config.mjs` — flat config, eslint-config-next
- `.prettierrc.mjs` — prettier + tailwind plugin
- `components.json` — config shadcn
- `vitest.config.ts` — vitest + jsdom
- `playwright.config.ts` — playwright com viewport mobile + desktop
- `.env.example` — chaves vazias documentadas
- `.env.local` — credenciais reais (gitignored)
- `.gitignore` — node_modules, .next, .env.local, etc.

### Supabase
- `supabase/config.toml` — gerado por `supabase init`
- `supabase/migrations/20260510000000_init_clientes_veiculos.sql` — schema base
- `supabase/migrations/20260510000001_seed_vw_modelos.sql` — catálogo VW
- `supabase/seed.sql` — vazio (seed via migration)

### App routes
- `src/middleware.ts` — protege `/app/*`, redireciona `/login`
- `src/app/layout.tsx` — html root, theme provider, sonner
- `src/app/globals.css` — Tailwind v4 + tokens shadcn
- `src/app/page.tsx` — landing/placeholder loja
- `src/app/login/page.tsx` — formulário de login
- `src/app/login/actions.ts` — server action signIn/signOut
- `src/app/auth/callback/route.ts` — callback OAuth (boilerplate, não usado ainda)
- `src/app/(admin)/layout.tsx` — shell autenticado (header + bottom-nav + sidebar)
- `src/app/(admin)/app/page.tsx` — dashboard placeholder
- `src/app/(public)/layout.tsx` — shell loja vazio (Sprint 6 preenche)

### Lib
- `src/lib/supabase/client.ts` — createBrowserClient
- `src/lib/supabase/server.ts` — createServerClient com cookies
- `src/lib/supabase/middleware.ts` — updateSession helper
- `src/lib/supabase/database.types.ts` — gerado por `pnpm db:gen`

### Components
- `src/components/ui/*` — shadcn (gerados pelo CLI)
- `src/components/shell/admin-header.tsx`
- `src/components/shell/bottom-nav.tsx`
- `src/components/shell/sidebar-desktop.tsx`
- `src/components/shell/theme-toggle.tsx`
- `src/components/theme-provider.tsx`

### Shared
- `src/shared/format/money.ts` (+ `money.test.ts`)
- `src/shared/format/date.ts` (+ `date.test.ts`)
- `src/shared/hooks/use-media-query.ts` (+ `use-media-query.test.ts`)

### Public assets
- `public/manifest.webmanifest`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/apple-touch-icon.png`
- `public/favicon.ico`

### Tests
- E2E: `e2e/login.spec.ts` — smoke "abre /login e vê título"
- Unit: lado a lado com cada helper (`*.test.ts`)

### CI
- `.github/workflows/ci.yml` — install + typecheck + lint + test + build

### Docs
- `README.md` — quickstart
- Update `docs/00-overview.md` — Sprint 0 → 🟢
- Update `docs/architecture/data-model.md` — Estado atual

---

## Task 1: Bootstrap Next.js + pnpm + estrutura básica

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `postcss.config.mjs`, `eslint.config.mjs`

- [ ] **Step 1.1: Inicializar projeto Next.js 15**

Rodar dentro de `sistema-oficina-pedrored/`. Como o diretório já contém arquivos (CLAUDE.md, docs/), usar nome temporário e mover:

```powershell
cd F:\Developments\pedro-red-sistema-oficina\sistema-oficina-pedrored
pnpm create next-app@latest _bootstrap --ts --tailwind --app --src-dir --import-alias "@/*" --use-pnpm --no-eslint --turbopack
```

Quando perguntar sobre arquivos extras, aceitar defaults. Aguardar instalação concluir.

- [ ] **Step 1.2: Mover arquivos do bootstrap pra raiz**

```powershell
Move-Item _bootstrap\* . -Force
Move-Item _bootstrap\.* . -Force -ErrorAction SilentlyContinue
Remove-Item _bootstrap -Recurse -Force
```

Verificar que `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` existem.

- [ ] **Step 1.3: Configurar `package.json` — engines, packageManager, scripts**

Substituir bloco superior do `package.json` por:

```json
{
  "name": "sistema-oficina-pedrored",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": "20.x",
    "pnpm": "9.x"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "db:gen": "supabase gen types typescript --project-id $env:SUPABASE_PROJECT_REF > src/lib/supabase/database.types.ts",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "format": "prettier --write ."
  }
}
```

(Manter o bloco `dependencies` / `devDependencies` gerado pelo create-next-app.)

- [ ] **Step 1.4: Commit inicial**

```powershell
git init
git add -A
git commit -m "chore: bootstrap Next.js 15 + TS + Tailwind + App Router"
```

---

## Task 2: Adicionar dependências da sprint

**Files:**
- Modify: `package.json`

- [ ] **Step 2.1: Instalar deps de UI**

```powershell
pnpm add lucide-react next-themes sonner vaul class-variance-authority clsx tailwind-merge
```

- [ ] **Step 2.2: Instalar deps de forms/validação**

```powershell
pnpm add zod react-hook-form "@hookform/resolvers"
```

- [ ] **Step 2.3: Instalar deps Supabase**

```powershell
pnpm add "@supabase/supabase-js" "@supabase/ssr"
pnpm add -D supabase
```

- [ ] **Step 2.4: Instalar deps PWA**

```powershell
pnpm add "@ducanh2912/next-pwa"
```

- [ ] **Step 2.5: Instalar deps lint/format**

```powershell
pnpm add -D eslint "@eslint/js" eslint-config-next prettier prettier-plugin-tailwindcss
```

- [ ] **Step 2.6: Instalar deps de teste**

```powershell
pnpm add -D vitest "@testing-library/react" "@testing-library/jest-dom" "@testing-library/dom" jsdom "@vitejs/plugin-react"
pnpm add -D "@playwright/test"
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 2.7: Commit**

```powershell
git add package.json pnpm-lock.yaml
git commit -m "chore: add sprint 0 dependencies (ui, forms, supabase, pwa, testing)"
```

---

## Task 3: Configurar Tailwind v4 + globals.css

**Files:**
- Modify: `src/app/globals.css`
- Create: `postcss.config.mjs` (se não criado pelo create-next-app)

- [ ] **Step 3.1: Verificar `postcss.config.mjs`**

Conteúdo esperado:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Se o arquivo gerado tiver outro formato, substituir pelo acima.

- [ ] **Step 3.2: Reescrever `src/app/globals.css` com tokens shadcn**

```css
@import "tailwindcss";

@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 3.3: Instalar tailwindcss-animate**

```powershell
pnpm add tailwindcss-animate
```

- [ ] **Step 3.4: Smoke `pnpm dev`**

```powershell
pnpm dev
```

Abrir `http://localhost:3000`. Confirmar página padrão renderiza sem erro CSS. Encerrar com Ctrl+C.

- [ ] **Step 3.5: Commit**

```powershell
git add -A
git commit -m "feat: configure Tailwind v4 with shadcn design tokens"
```

---

## Task 4: Inicializar shadcn/ui

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/*`

- [ ] **Step 4.1: Rodar init do shadcn**

```powershell
pnpm dlx shadcn@latest init
```

Respostas:
- TypeScript: yes
- Style: New York
- Base color: Slate
- CSS variables: yes
- (aceitar defaults para o resto)

Verificar que `components.json` foi criado e `src/lib/utils.ts` existe com a função `cn`.

- [ ] **Step 4.2: Adicionar componentes shadcn iniciais**

```powershell
pnpm dlx shadcn@latest add button card input label dialog sheet drawer dropdown-menu table tabs sonner badge avatar separator skeleton form
```

Aceitar prompts. Verificar que `src/components/ui/` ficou populado.

- [ ] **Step 4.3: Verificar build limpa**

```powershell
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Step 4.4: Commit**

```powershell
git add -A
git commit -m "feat: initialize shadcn/ui with base components"
```

---

## Task 5: Helper de formatação monetária (TDD)

**Files:**
- Create: `src/shared/format/money.ts`, `src/shared/format/money.test.ts`
- Create: `vitest.config.ts`, `vitest.setup.ts`

- [ ] **Step 5.1: Criar `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 5.2: Criar `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5.3: Escrever testes falhando — `src/shared/format/money.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { formatBRL, parseBRL } from "./money";

describe("formatBRL", () => {
  it("formata número positivo com duas casas", () => {
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50");
  });

  it("formata string numérica", () => {
    expect(formatBRL("99.9")).toBe("R$ 99,90");
  });

  it("formata zero", () => {
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("formata negativo", () => {
    expect(formatBRL(-50)).toBe("-R$ 50,00");
  });

  it("formata milhares grandes", () => {
    expect(formatBRL(1234567.89)).toBe("R$ 1.234.567,89");
  });

  it("retorna R$ 0,00 para entrada inválida", () => {
    expect(formatBRL("xyz")).toBe("R$ 0,00");
  });
});

describe("parseBRL", () => {
  it("converte string formatada em número", () => {
    expect(parseBRL("R$ 1.234,50")).toBe(1234.5);
  });

  it("aceita só dígitos com vírgula", () => {
    expect(parseBRL("99,90")).toBe(99.9);
  });

  it("aceita string vazia como 0", () => {
    expect(parseBRL("")).toBe(0);
  });

  it("ignora caracteres não-numéricos", () => {
    expect(parseBRL("R$1.000,00 (à vista)")).toBe(1000);
  });
});
```

- [ ] **Step 5.4: Rodar teste — deve falhar**

```powershell
pnpm test src/shared/format/money.test.ts
```

Esperado: FAIL com "Cannot find module './money'".

- [ ] **Step 5.5: Implementar `src/shared/format/money.ts`**

```ts
const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number | string): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return BRL_FORMATTER.format(0);
  return BRL_FORMATTER.format(numeric);
}

export function parseBRL(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}
```

- [ ] **Step 5.6: Rodar teste — deve passar**

```powershell
pnpm test src/shared/format/money.test.ts
```

Esperado: PASS (10 testes).

- [ ] **Step 5.7: Commit**

```powershell
git add -A
git commit -m "feat(format): add formatBRL and parseBRL helpers with tests"
```

---

## Task 6: Helper de formatação de data (TDD)

**Files:**
- Create: `src/shared/format/date.ts`, `src/shared/format/date.test.ts`

- [ ] **Step 6.1: Escrever testes falhando**

```ts
import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./date";

describe("formatDate", () => {
  it("formata Date em dd/MM/yyyy", () => {
    expect(formatDate(new Date("2026-05-11T03:00:00.000Z"))).toBe("11/05/2026");
  });

  it("aceita string ISO", () => {
    expect(formatDate("2026-01-02T03:00:00.000Z")).toBe("02/01/2026");
  });

  it("retorna string vazia para entrada inválida", () => {
    expect(formatDate("not-a-date")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("formata data + hora pt-BR no fuso São Paulo", () => {
    const result = formatDateTime("2026-05-11T15:30:00.000Z");
    expect(result).toMatch(/^11\/05\/2026,? 12:30$/);
  });

  it("retorna string vazia para entrada inválida", () => {
    expect(formatDateTime("garbage")).toBe("");
  });
});
```

- [ ] **Step 6.2: Rodar teste — deve falhar**

```powershell
pnpm test src/shared/format/date.test.ts
```

Esperado: FAIL com "Cannot find module './date'".

- [ ] **Step 6.3: Implementar `src/shared/format/date.ts`**

```ts
const TZ = "America/Sao_Paulo";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(input: Date | string): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(input: Date | string): string {
  const date = toDate(input);
  return date ? DATE_FORMATTER.format(date) : "";
}

export function formatDateTime(input: Date | string): string {
  const date = toDate(input);
  return date ? DATETIME_FORMATTER.format(date) : "";
}
```

- [ ] **Step 6.4: Rodar teste — deve passar**

```powershell
pnpm test src/shared/format/date.test.ts
```

Esperado: PASS (5 testes).

- [ ] **Step 6.5: Commit**

```powershell
git add -A
git commit -m "feat(format): add formatDate and formatDateTime in pt-BR/Sao_Paulo"
```

---

## Task 7: Hook useIsMobile (TDD)

**Files:**
- Create: `src/shared/hooks/use-media-query.ts`, `src/shared/hooks/use-media-query.test.ts`

- [ ] **Step 7.1: Escrever teste falhando**

```ts
import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile, useMediaQuery } from "./use-media-query";

function mockMatchMedia(matches: boolean) {
  const listeners: ((event: { matches: boolean }) => void)[] = [];
  const mql = {
    matches,
    media: "",
    addEventListener: (_: string, cb: (event: { matches: boolean }) => void) => listeners.push(cb),
    removeEventListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue(mql),
  });
  return { mql, fire: (m: boolean) => listeners.forEach((cb) => cb({ matches: m })) };
}

describe("useMediaQuery", () => {
  beforeEach(() => mockMatchMedia(false));

  it("retorna false quando query não bate", () => {
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("retorna true quando query bate", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(true);
  });
});

describe("useIsMobile", () => {
  it("retorna true quando viewport ≤ 768px", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("retorna false quando viewport > 768px", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 7.2: Rodar teste — deve falhar**

```powershell
pnpm test src/shared/hooks/use-media-query.test.ts
```

Esperado: FAIL.

- [ ] **Step 7.3: Implementar `src/shared/hooks/use-media-query.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent | { matches: boolean }) => {
      setMatches(event.matches);
    };
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}
```

- [ ] **Step 7.4: Rodar teste — deve passar**

```powershell
pnpm test src/shared/hooks/use-media-query.test.ts
```

Esperado: PASS (4 testes).

- [ ] **Step 7.5: Commit**

```powershell
git add -A
git commit -m "feat(hooks): add useMediaQuery and useIsMobile"
```

---

## Task 8: Inicializar Supabase CLI + migrations

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/20260510000000_init_clientes_veiculos.sql`, `supabase/migrations/20260510000001_seed_vw_modelos.sql`, `supabase/seed.sql`

- [ ] **Step 8.1: Inicializar Supabase**

```powershell
pnpm exec supabase init
```

Aceitar defaults. Confirma criação de `supabase/config.toml` e diretório `supabase/migrations/`.

- [ ] **Step 8.2: Vincular ao projeto remoto**

```powershell
pnpm exec supabase login
pnpm exec supabase link --project-ref <SUPABASE_PROJECT_REF>
```

(Trocar `<SUPABASE_PROJECT_REF>` pelo valor real coletado.)

- [ ] **Step 8.3: Criar migration `20260510000000_init_clientes_veiculos.sql`**

```sql
-- Trigger genérico de atualizado_em
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

-- Catálogo VW
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
  endereco jsonb,
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
  modelo_custom text,
  motor text,
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

- [ ] **Step 8.4: Criar migration `20260510000001_seed_vw_modelos.sql`**

```sql
insert into vw_modelos (modelo, motor, combustivel, ano_inicio, ano_fim) values
-- MSI (aspirado)
('Gol', '1.0 MSI', 'flex', 2014, 2024),
('Gol', '1.6 MSI', 'flex', 2014, 2024),
('Voyage', '1.0 MSI', 'flex', 2014, 2023),
('Voyage', '1.6 MSI', 'flex', 2014, 2023),
('Saveiro', '1.6 MSI', 'flex', 2014, null),
('Polo', '1.6 MSI', 'flex', 2017, null),
('Virtus', '1.6 MSI', 'flex', 2018, null),
('T-Cross', '1.6 MSI', 'flex', 2019, null),
('Up!', '1.0 MPI', 'flex', 2014, 2021),
-- TSI (turbo)
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

- [ ] **Step 8.5: Aplicar migrations no remoto**

```powershell
pnpm exec supabase db push
```

Aceitar prompts. Verificar no dashboard Supabase (Table Editor) que `vw_modelos` tem 24 linhas e `clientes`/`veiculos` existem vazias.

- [ ] **Step 8.6: Confirmar RLS ativo**

No SQL Editor do Supabase, rodar:

```sql
select relname, relrowsecurity from pg_class where relname in ('vw_modelos','clientes','veiculos');
```

Esperado: `relrowsecurity = t` para as três.

- [ ] **Step 8.7: Commit**

```powershell
git add supabase/
git commit -m "feat(db): init schema with clientes, veiculos, vw_modelos + RLS"
```

---

## Task 9: Configurar variáveis de ambiente

**Files:**
- Create: `.env.example`, `.env.local`
- Modify: `.gitignore`

- [ ] **Step 9.1: Confirmar `.gitignore` ignora `.env.local`**

Abrir `.gitignore` e garantir as linhas:

```
.env*.local
.env.local
.env.development.local
.env.production.local
```

Se não existirem, adicionar.

- [ ] **Step 9.2: Criar `.env.example`**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_DB_URL=

# Adicionado em Sprint 5
# EVOLUTION_API_URL=
# EVOLUTION_API_KEY=
# EVOLUTION_INSTANCE_NAME=

# Adicionado em Sprint 6
# PIX_CHAVE=
# PIX_NOME_BENEFICIARIO=
# PIX_CIDADE=

# Adicionado em Sprint 7
# GEMINI_API_KEY=
# ANALYTICS_PROVIDER=gemini
```

- [ ] **Step 9.3: Criar `.env.local` com credenciais reais**

```
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
SUPABASE_PROJECT_REF=<SUPABASE_PROJECT_REF>
```

- [ ] **Step 9.4: Gerar tipos do Supabase**

```powershell
$env:SUPABASE_PROJECT_REF="<SUPABASE_PROJECT_REF>"
pnpm db:gen
```

Verificar que `src/lib/supabase/database.types.ts` foi criado com tipos pra `clientes`, `veiculos`, `vw_modelos`.

- [ ] **Step 9.5: Commit (sem .env.local!)**

```powershell
git add .env.example .gitignore src/lib/supabase/database.types.ts
git commit -m "chore(env): add .env.example and generate Supabase types"
```

---

## Task 10: Implementar clients Supabase (browser, server, middleware)

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`

- [ ] **Step 10.1: Criar `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 10.2: Criar `src/lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components não podem setar cookies; tudo bem se middleware atualizar.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 10.3: Criar `src/lib/supabase/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isAdminRoute = url.pathname.startsWith("/app");
  const isLoginRoute = url.pathname === "/login";

  if (!user && isAdminRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 10.4: Typecheck**

```powershell
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Step 10.5: Commit**

```powershell
git add -A
git commit -m "feat(supabase): add SSR clients (browser, server, middleware)"
```

---

## Task 11: Implementar `src/middleware.ts`

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 11.1: Criar arquivo**

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 11.2: Typecheck + lint**

```powershell
pnpm typecheck
pnpm lint
```

Esperado: zero erros.

- [ ] **Step 11.3: Commit**

```powershell
git add -A
git commit -m "feat(middleware): protect /app routes and redirect on auth state"
```

---

## Task 12: Implementar login (página + server action)

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`

- [ ] **Step 12.1: Criar server action `src/app/login/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export type SignInResult = { ok: true } | { ok: false; error: string };

export async function signIn(_: SignInResult | null, formData: FormData): Promise<SignInResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });

  if (error) {
    return { ok: false, error: "Email ou senha incorretos" };
  }

  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 12.2: Criar `src/app/login/page.tsx`**

```tsx
"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type SignInResult } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<SignInResult | null, FormData>(
    signIn,
    null,
  );

  useEffect(() => {
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse o sistema PedroRed</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 12.3: Typecheck**

```powershell
pnpm typecheck
```

- [ ] **Step 12.4: Commit**

```powershell
git add -A
git commit -m "feat(auth): add login page with email/password and zod validation"
```

---

## Task 13: Implementar callback OAuth (boilerplate)

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 13.1: Criar route handler**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
```

- [ ] **Step 13.2: Commit**

```powershell
git add -A
git commit -m "feat(auth): add OAuth callback route handler (placeholder)"
```

---

## Task 14: Theme provider + toggle

**Files:**
- Create: `src/components/theme-provider.tsx`, `src/components/shell/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 14.1: Criar `src/components/theme-provider.tsx`**

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 14.2: Criar `src/components/shell/theme-toggle.tsx`**

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
```

- [ ] **Step 14.3: Atualizar `src/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "PedroRed — Oficina VW",
  description: "Sistema de gestão da oficina PedroRed.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "PedroRed", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors closeButton position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 14.4: Typecheck**

```powershell
pnpm typecheck
```

- [ ] **Step 14.5: Commit**

```powershell
git add -A
git commit -m "feat(theme): add theme provider, toggle, and root layout with sonner"
```

---

## Task 15: Shell admin (header + bottom-nav + sidebar)

**Files:**
- Create: `src/components/shell/admin-header.tsx`, `src/components/shell/bottom-nav.tsx`, `src/components/shell/sidebar-desktop.tsx`, `src/app/(admin)/layout.tsx`, `src/app/(admin)/app/page.tsx`

- [ ] **Step 15.1: Criar `src/components/shell/bottom-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, Home, Menu, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Início", icon: Home, match: (p: string) => p === "/app" },
  { href: "/app/os", label: "OS", icon: FileText, match: (p: string) => p.startsWith("/app/os") },
  { href: "/app/estoque", label: "Estoque", icon: Package, match: (p: string) => p.startsWith("/app/estoque") },
  { href: "/app/agenda", label: "Agenda", icon: Calendar, match: (p: string) => p.startsWith("/app/agenda") },
  { href: "/app/mais", label: "Mais", icon: Menu, match: (p: string) => p.startsWith("/app/mais") },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 15.2: Criar `src/components/shell/sidebar-desktop.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, Home, Package, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Dashboard", icon: Home, match: (p: string) => p === "/app" },
  { href: "/app/os", label: "Ordens de Serviço", icon: FileText, match: (p: string) => p.startsWith("/app/os") },
  { href: "/app/clientes", label: "Clientes", icon: Users, match: (p: string) => p.startsWith("/app/clientes") },
  { href: "/app/estoque", label: "Estoque", icon: Package, match: (p: string) => p.startsWith("/app/estoque") },
  { href: "/app/agenda", label: "Agenda", icon: Calendar, match: (p: string) => p.startsWith("/app/agenda") },
  { href: "/app/financeiro", label: "Financeiro", icon: Wallet, match: (p: string) => p.startsWith("/app/financeiro") },
];

export function SidebarDesktop() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
      <nav aria-label="Navegação lateral" className="sticky top-14 grid gap-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 15.3: Criar `src/components/shell/admin-header.tsx`**

```tsx
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
      <Link href="/app" className="font-semibold tracking-tight">
        PedroRed
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu do usuário">
              <Avatar className="size-8">
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOut className="mr-2 size-4" /> Sair
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 15.4: Criar `src/app/(admin)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/shell/admin-header";
import { BottomNav } from "@/components/shell/bottom-nav";
import { SidebarDesktop } from "@/components/shell/sidebar-desktop";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <SidebarDesktop />
        <main className="flex-1 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 15.5: Criar `src/app/(admin)/app/page.tsx`**

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Olá, Pedro</h1>
      <p className="text-sm text-muted-foreground">Visão geral da oficina (placeholder Sprint 0).</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>OS abertas</CardTitle>
            <CardDescription>Sprint 1</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>A receber</CardTitle>
            <CardDescription>Sprint 2</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agendados hoje</CardTitle>
            <CardDescription>Sprint 4</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 15.6: Typecheck**

```powershell
pnpm typecheck
```

- [ ] **Step 15.7: Commit**

```powershell
git add -A
git commit -m "feat(shell): admin header, bottom-nav, sidebar, and dashboard placeholder"
```

---

## Task 16: Shell público + landing placeholder

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 16.1: Criar `src/app/(public)/layout.tsx`**

```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
```

- [ ] **Step 16.2: Substituir `src/app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">PedroRed Store</h1>
        <p className="text-muted-foreground">
          Em breve: catálogo de peças e acessórios da oficina.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 16.3: Smoke local — `pnpm dev` e abrir tudo**

```powershell
pnpm dev
```

Em outro terminal/navegador:
- `http://localhost:3000/` → "PedroRed Store em breve"
- `http://localhost:3000/login` → formulário "Entrar"
- `http://localhost:3000/app` → redireciona pra `/login`

Encerrar com Ctrl+C.

- [ ] **Step 16.4: Commit**

```powershell
git add -A
git commit -m "feat(public): add landing placeholder and public layout"
```

---

## Task 17: PWA (manifest + ícones + next-pwa)

**Files:**
- Create: `public/manifest.webmanifest`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`
- Modify: `next.config.ts`

- [ ] **Step 17.1: Gerar ícones placeholder**

Usar qualquer ferramenta para gerar 3 PNGs sólidos vermelhos (#dc2626) com letra "P" branca:
- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512)
- `public/icons/apple-touch-icon.png` (180×180)

Sugestão rápida: gerar online em https://realfavicongenerator.net/ ou via SVG inline → exportar. Se não houver ferramenta gráfica disponível, salvar 3 PNGs vermelhos lisos com dimensões corretas (logo definitivo entra depois).

- [ ] **Step 17.2: Criar `public/manifest.webmanifest`**

```json
{
  "name": "PedroRed — Oficina VW",
  "short_name": "PedroRed",
  "description": "Sistema de gestão da oficina PedroRed.",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#dc2626",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 17.3: Configurar `next.config.ts` com next-pwa**

```ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: { skipWaiting: true },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
```

- [ ] **Step 17.4: Build pra confirmar PWA gera service worker**

```powershell
pnpm build
```

Esperado: build verde + arquivos `public/sw.js` e `public/workbox-*.js` gerados.

- [ ] **Step 17.5: Adicionar arquivos PWA gerados ao .gitignore**

Em `.gitignore`:

```
# next-pwa
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
public/fallback-*.js
```

- [ ] **Step 17.6: Commit**

```powershell
git add -A
git commit -m "feat(pwa): add manifest, icons, and next-pwa config"
```

---

## Task 18: Playwright config + smoke E2E

**Files:**
- Create: `playwright.config.ts`, `e2e/login.spec.ts`

- [ ] **Step 18.1: Criar `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 18.2: Criar `e2e/login.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("página de login renderiza com título e form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
});

test("acesso a /app sem login redireciona para /login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
});
```

- [ ] **Step 18.3: Rodar E2E**

```powershell
pnpm e2e
```

Esperado: 4 testes verdes (2 testes × 2 projects mobile/desktop).

- [ ] **Step 18.4: Commit**

```powershell
git add -A
git commit -m "test(e2e): add playwright config and login smoke test"
```

---

## Task 19: ESLint + Prettier config

**Files:**
- Create/Modify: `eslint.config.mjs`, `.prettierrc.mjs`, `.prettierignore`

- [ ] **Step 19.1: Criar/atualizar `eslint.config.mjs`**

```js
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["node_modules/**", ".next/**", "public/sw.js", "public/workbox-*.js", "src/lib/supabase/database.types.ts"],
  },
];

export default eslintConfig;
```

(Instalar `@eslint/eslintrc` se faltar: `pnpm add -D @eslint/eslintrc`.)

- [ ] **Step 19.2: Criar `.prettierrc.mjs`**

```js
export default {
  semi: true,
  singleQuote: false,
  printWidth: 100,
  trailingComma: "all",
  arrowParens: "always",
  plugins: ["prettier-plugin-tailwindcss"],
};
```

- [ ] **Step 19.3: Criar `.prettierignore`**

```
.next
node_modules
pnpm-lock.yaml
public/sw.js
public/workbox-*.js
src/lib/supabase/database.types.ts
supabase/.branches
```

- [ ] **Step 19.4: Rodar lint + format**

```powershell
pnpm lint
pnpm format
```

Esperado: zero erros após format.

- [ ] **Step 19.5: Commit**

```powershell
git add -A
git commit -m "chore(lint): configure eslint flat config and prettier with tailwind plugin"
```

---

## Task 20: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 20.1: Criar workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

- [ ] **Step 20.2: Commit**

```powershell
git add -A
git commit -m "ci: add GitHub Actions workflow (typecheck, lint, test, build)"
```

---

## Task 21: README + atualização de docs

**Files:**
- Create: `README.md`
- Modify: `docs/00-overview.md`, `docs/architecture/data-model.md`

- [ ] **Step 21.1: Criar `README.md`**

```markdown
# Sistema Oficina PedroRed

Sistema web mobile-first para gestão da oficina mecânica PedroRed (linha Volkswagen).
Stack: Next.js 15 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Supabase · PWA.

## Quickstart

Pré-requisitos: Node 20 LTS, pnpm 9, Supabase CLI.

```bash
pnpm install
cp .env.example .env.local   # preencher credenciais Supabase
pnpm db:gen                   # gera tipos do Supabase
pnpm dev                      # http://localhost:3000
```

## Comandos

| Comando | O que faz |
|---------|-----------|
| `pnpm dev` | Servidor local em :3000 |
| `pnpm build` | Build de produção |
| `pnpm typecheck` | TS check sem emit |
| `pnpm lint` | ESLint flat config |
| `pnpm test` | Vitest unit tests |
| `pnpm e2e` | Playwright E2E |
| `pnpm db:gen` | Gera tipos do Supabase |
| `pnpm db:migrate` | Aplica migrations remotas (`supabase db push`) |

## Documentação

Toda documentação canônica vive em `docs/`. Leia primeiro:
- `docs/00-overview.md` — visão mestre + roadmap por sprint
- `docs/architecture/stack.md` — versões e justificativas
- `docs/architecture/data-model.md` — schema vivo

Para sessões Claude: o arquivo `CLAUDE.md` na raiz é o bootstrap obrigatório.
```

- [ ] **Step 21.2: Atualizar `docs/00-overview.md` — Sprint 0 → 🟢**

Modificar a linha da tabela:

```
| 0 | Setup | 🟢 implementada | <branch ou PR> | — |
```

- [ ] **Step 21.3: Atualizar `docs/architecture/data-model.md` — seção Estado atual**

Substituir a seção "Estado atual":

```markdown
## Estado atual

**Sprint corrente: 0 — implementada.** Schema base aplicado.

Tabelas existentes:

- `vw_modelos` (catálogo VW, 24 rows seed) — `id`, `modelo`, `motor`, `combustivel`, `ano_inicio`, `ano_fim`, `criado_em`. Unique(modelo, motor). RLS: authenticated_all.
- `clientes` — `id`, `nome`, `telefone`, `email`, `cpf`, `endereco jsonb`, `observacoes`, timestamps + soft delete. RLS: authenticated_all.
- `veiculos` — `id`, `cliente_id` (FK clientes), `modelo_id` (FK vw_modelos, nullable), `modelo_custom`, `motor`, `ano`, `placa`, `cor`, `km_atual`, `observacoes`, timestamps + soft delete. Constraint: `modelo_id` OR `modelo_custom` presente. RLS: authenticated_all.

Função: `set_atualizado_em()` (trigger reutilizado por tabelas com `atualizado_em`).
```

- [ ] **Step 21.4: Commit**

```powershell
git add -A
git commit -m "docs: add README and update overview/data-model for sprint 0"
```

---

## Task 22: Criar conta do Pedro no Supabase Auth

**Files:** N/A (operação via dashboard Supabase)

- [ ] **Step 22.1: Criar usuário**

Acessar `https://supabase.com/dashboard/project/<SUPABASE_PROJECT_REF>/auth/users` → "Add user" → "Create new user".

Campos:
- Email: `<EMAIL_PEDRO>`
- Password: `<SENHA_INICIAL_PEDRO>`
- "Auto Confirm User": ✓ (marcado)

Confirmar criação.

- [ ] **Step 22.2: Testar login local**

```powershell
pnpm dev
```

Em `http://localhost:3000/login`:
- Email: `<EMAIL_PEDRO>`
- Senha: `<SENHA_INICIAL_PEDRO>`
- Submeter → deve redirecionar para `/app` com header "Olá, Pedro" + bottom-nav visível em viewport mobile.

Encerrar `pnpm dev`.

- [ ] **Step 22.3: Sair (sign out) via dropdown avatar**

Confirmar que clique em "Sair" volta para `/login` e cookies são limpos.

---

## Task 23: Push GitHub + deploy Vercel

**Files:** N/A (operação externa)

- [ ] **Step 23.1: Criar repositório remoto e fazer push inicial**

```powershell
git remote add origin <GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

- [ ] **Step 23.2: Importar no Vercel**

Acessar `https://vercel.com/new` → Import Git Repository → selecionar o repo recém-criado.

Configurações:
- Framework: Next.js (auto-detectado)
- Root Directory: `sistema-oficina-pedrored` (se o repo tiver pasta extra) ou root
- Build Command: `pnpm build` (auto)
- Install Command: `pnpm install` (auto)

- [ ] **Step 23.3: Adicionar env vars no painel Vercel**

Em Project Settings → Environment Variables, adicionar (todas para Production, Preview e Development):

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `<SUPABASE_URL>` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<SUPABASE_ANON_KEY>` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<SUPABASE_SERVICE_ROLE_KEY>` (apenas Production) |

- [ ] **Step 23.4: Deploy**

Clicar Deploy. Aguardar build verde.

- [ ] **Step 23.5: Testar URL pública**

Abrir `pedrored.vercel.app` (ou URL gerada):
- `/` → landing
- `/login` → form
- Login com credenciais Pedro → `/app`
- Logout funciona

- [ ] **Step 23.6: Adicionar secrets ao GitHub Actions**

Em `https://github.com/<owner>/<repo>/settings/secrets/actions`, adicionar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Reexecutar workflow e confirmar verde.

---

## Task 24: Validação final + handoff Pedro

**Files:** N/A

- [ ] **Step 24.1: Verificação automatizada local**

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e
pnpm build
```

Todos verdes.

- [ ] **Step 24.2: Verificação visual mobile (DevTools 375×667)**

Em `pnpm dev`:
- DevTools → toggle device → iPhone SE (375×667)
- `/` → landing legível, centralizada
- `/login` → form mobile-friendly, inputs com altura tocável
- `/app` (logado) → bottom-nav visível, sidebar oculta
- Alternar tema claro/escuro pelo header → persiste após reload

- [ ] **Step 24.3: Verificação visual desktop (1280×800)**

- `/app` → sidebar visível, bottom-nav oculta
- Dashboard mostra 3 cards placeholder

- [ ] **Step 24.4: Confirmação Supabase**

No dashboard Supabase → Table Editor:
- `vw_modelos`: 24 rows
- `clientes`: 0 rows
- `veiculos`: 0 rows
- RLS habilitado nas três (ícone de cadeado verde)

- [ ] **Step 24.5: Validação Pedro (manual)**

Mandar mensagem pra Pedro com:
- URL pública (Vercel)
- Email + senha
- Instrução: "abra no celular, entre, navegue pelo bottom-nav, instale como app (Compartilhar → Adicionar à Tela de Início no Safari ou menu ⋮ → Adicionar à tela inicial no Chrome) e abra o app instalado".

Aguardar confirmação por WhatsApp de Pedro.

- [ ] **Step 24.6: Atualizar status Sprint 0 → ✅**

Em `docs/00-overview.md`:

```
| 0 | Setup | ✅ validada | main | ✅ |
```

Em `docs/sprints/sprint-00-setup.md` seção "Progresso", adicionar nota: "✅ validada por Pedro em <DATA>".

- [ ] **Step 24.7: Commit final**

```powershell
git add docs/
git commit -m "docs: mark sprint 0 as validated by Pedro"
git push
```

---

## Verificação cruzada com Definition of Done (sprint-00-setup.md)

| Critério DoD | Onde foi atendido |
|--------------|-------------------|
| `pnpm install` sem erro | Task 2 |
| `pnpm typecheck` passa | Task 24.1 |
| `pnpm lint` passa | Task 24.1 |
| `pnpm test` passa | Tasks 5-7 + 24.1 |
| `pnpm e2e` passa | Tasks 18 + 24.1 |
| `pnpm build` passa | Tasks 17.4 + 24.1 |
| CI GitHub Actions verde | Task 20 + 23.6 |
| `pnpm dev` funciona | Task 3.4, 16.3 |
| `/` renderiza placeholder | Task 16 + 24 |
| `/login` aceita credenciais e redireciona | Task 12, 22 |
| `/app` mostra dashboard mobile/desktop | Task 15, 24.2, 24.3 |
| Tema toggle persiste | Task 14, 24.2 |
| Tabelas existem com RLS | Task 8, 24.4 |
| Tipos `Database` gerados | Task 9.4 |
| Pedro testa no celular + instala PWA | Task 24.5 |
| Status `docs/` atualizado | Task 21.3, 24.6 |
| PR mergeado / deploy Vercel verde | Task 23.4, 23.5 |

---

## Notas de execução

- **Ordem rigorosa nas tasks 1-4 e 8-11.** O resto pode ser paralelizado se quiser, mas comprometeria atomicidade dos commits — manter sequencial é mais seguro.
- **Não pular pnpm build após mudanças em next.config.ts ou tailwind.** Erros de config explodem cedo.
- **Migrations só vão pra produção em uma direção.** Se errar, criar nova migration corretiva. Nunca editar migration já pushada.
- **`.env.local` jamais entra em commit.** Verificar `git status` antes de cada `git add -A`.
- **Pedro testa do celular dele, com 4G real.** Não confiar em "funciona no localhost".

---

## Self-Review (executado pelo autor do plano)

**Spec coverage:** todas as 28 tasks do sprint-00-setup.md mapeadas — bootstrap (T1-2), Tailwind (T3), shadcn (T4), helpers (T5-7), Supabase migrations (T8), envs e tipos (T9), clients Supabase (T10), middleware (T11), login (T12-13), tema (T14), shell admin (T15), shell público (T16), PWA (T17), Playwright (T18), ESLint/Prettier (T19), CI (T20), docs (T21), conta Pedro (T22), deploy (T23), validação (T24). ✓

**Placeholders:** todos os `<...>` são valores externos do ambiente (credenciais, repo URL) com instruções explícitas de coleta no header. Nenhum "TBD" ou "implement later". ✓

**Type consistency:** `formatBRL`/`parseBRL`/`formatDate`/`formatDateTime`/`useIsMobile`/`useMediaQuery` consistentes entre testes e implementação. Server actions retornam `SignInResult` consistente. ✓
