# Stack — Versões e Justificativas

> Atualize este arquivo no mesmo PR que adiciona/remove/atualiza dependência major.

## Runtime

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| Node.js | 20 LTS (Vercel default) | LTS, suportada por todos os pacotes abaixo |
| pnpm | 9.x | Gerenciador rápido, lock determinístico, suporte excelente a workspaces se um dia precisarmos |

## Core framework

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| `next` | 15.x | App Router estável, Server Actions GA, React 19 nativo |
| `react` | 19.x | Atualização do Next 15. `useActionState`, `useOptimistic` úteis para forms |
| `typescript` | 5.x | Padrão do mercado, tipagem dos types gerados pelo Supabase |

## UI

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| `tailwindcss` | 4.x | CSS-first config, performance superior à v3 |
| `@tailwindcss/postcss` | 4.x | Integração com Next 15 |
| `shadcn/ui` | latest (CLI) | Componentes copiados, controle total, base do Radix UI (acessível) |
| `lucide-react` | latest | Ícones, padrão shadcn |
| `next-themes` | latest | Tema claro/escuro |
| `vaul` | latest | Drawer/bottom-sheet mobile (usado por shadcn `Drawer`) |
| `sonner` | latest | Toast notifications |

## Forms / validação

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| `zod` | 3.x | Validação tipada, integra com Server Actions e React Hook Form |
| `react-hook-form` | latest | Forms performáticos, controle de estado |
| `@hookform/resolvers` | latest | Bridge entre RHF e zod |

## Supabase

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| `@supabase/supabase-js` | 2.x | Cliente oficial |
| `@supabase/ssr` | latest | Setup recomendado para Next App Router (cookies-aware) |
| `supabase` (CLI dev dependency) | latest | Migrations + geração de tipos |

## PWA

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| `@ducanh2912/next-pwa` | latest | Fork mantido do `next-pwa` compatível com App Router |

## Testes

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| `vitest` | 1.x | Test runner rápido, API tipo Jest, integra com TS sem config |
| `@testing-library/react` | latest | Testes de componentes |
| `@playwright/test` | latest | E2E mobile + desktop, suporte device emulation |

## Lint / format

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| `eslint` | 9.x | Padrão Next.js |
| `eslint-config-next` | 15.x | Regras Next + React |
| `prettier` | latest | Formatação |
| `prettier-plugin-tailwindcss` | latest | Ordena classes Tailwind |

## Outros (adicionados por sprint)

Sprint 2 (financeiro):
- `dinero.js` v2 (opcional) — operações monetárias seguras se precisarmos de muitos cálculos. Senão, manipula como string + helper próprio.

Sprint 5 (WhatsApp):
- Integração via fetch direto à Evolution API (HTTP). Sem SDK específico.

Sprint 7 (IA):
- `@google/generative-ai` — SDK oficial Gemini. Encapsulado por interface `AnalyticsProvider` em `src/features/analytics/providers/`.

## Variáveis de ambiente

```bash
# .env.local (nunca commitado)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # apenas server-side
SUPABASE_DB_URL=postgresql://...        # CLI migrations

# Adicionado no Sprint 5
EVOLUTION_API_URL=https://wa.pedrored.com.br
EVOLUTION_API_KEY=xxx
EVOLUTION_INSTANCE_NAME=pedrored

# Adicionado no Sprint 6
PIX_CHAVE=pedrored@email.com            # ou CPF/CNPJ/telefone
PIX_NOME_BENEFICIARIO=Pedro Silva
PIX_CIDADE=Cidade

# Adicionado no Sprint 7
GEMINI_API_KEY=xxx
ANALYTICS_PROVIDER=gemini               # gemini | openai | nvidia
```

`.env.example` com chaves vazias deve sempre acompanhar mudanças.

## Por que NÃO usamos

- **Drizzle/Prisma:** Supabase já gera tipos. Adicionar ORM duplica responsabilidade. Queries em SQL puro via `supabase-js` ou Postgres functions.
- **tRPC:** Server Actions cobrem o caso. Adicionar tRPC traz complexidade sem ganho aqui.
- **Redux/Zustand global:** Server Components + URL state + form state cobrem 95%. Se aparecer caso real de estado global cliente complexo, reabrir.
- **Vercel KV / Upstash:** Supabase Postgres + RLS + materialized views resolvem cache/leitura rápida no MVP. Adicionar quando houver gargalo medido.
- **Stripe / pagamento real:** Pedro não tem maquininha. PIX manual no MVP. Stripe entra se ele quiser cartão.
