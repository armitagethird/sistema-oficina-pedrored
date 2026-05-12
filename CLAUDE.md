# CLAUDE.md — Sistema Oficina PedroRed

> **Bootstrap obrigatório para qualquer sessão Claude neste projeto.**
> Leia esta página inteira antes de qualquer ação.

## Quem é o cliente

**Pedro** (apelido PedroRed) — mecânico autônomo especializado em linha Volkswagen (TSI/MSI). Trabalha sozinho na oficina dele. Atende demanda volátil (1 a 6 carros/dia). Vende peças com markup, manda link de afiliado Mercado Livre, mistura caixa pessoal e da oficina, perde rastro quando acumula carros simultâneos.

Sistema é **single-user** (só Pedro acessa o admin). Loja pública é anônima (clientes navegam sem cadastro).

## Como este projeto trabalha

Desenvolvimento em **8 sprints sequenciais e validáveis**. Cada sprint encerra quando Pedro testa no celular dele com dados reais e aprova. Bug crítico bloqueia próxima sprint.

**Entre sprints o usuário (Romero) reinicia o Claude Code para zerar o context window.** Por isso, cada `docs/sprints/sprint-XX-*.md` é **completamente self-contained** — assume nenhum contexto carregado da sessão anterior.

## Bootstrap obrigatório a cada sessão

Quando uma sessão começar (independente do prompt do usuário), faça nesta ordem:

1. Leia `docs/00-overview.md` — visão geral, stack, decisões fechadas, status atual do roadmap.
2. Leia `docs/architecture/stack.md` — versões exatas de dependências e justificativas.
3. Leia `docs/architecture/data-model.md` — schema vivo do Supabase no estado atual (todas migrations aplicadas até hoje).
4. Identifique a sprint corrente (status no `docs/00-overview.md` → seção "Status do roadmap").
5. Leia `docs/sprints/sprint-XX-*.md` da sprint corrente — instruções detalhadas dela.
6. Só então responda ao prompt do usuário.

Se o usuário pedir algo fora da sprint corrente, **avise antes de fazer**: "Isso é da Sprint Y, não da corrente Z. Quer adiantar?"

## Padrões de código

- **Linguagem UI:** pt-BR. Identificadores no código em inglês (`createOrder` não `criarOrdem`), exceto entidades de domínio que mantêm pt-BR (`ordens_servico`, `clientes`) por casamento direto com schema do banco.
- **Estrutura de pastas:** features-first em `src/features/{ordens, clientes, veiculos, financeiro, estoque, agenda, whatsapp, loja, analytics}`. Cada feature tem `components/`, `actions.ts` (server actions), `queries.ts` (server-side reads), `schemas.ts` (zod), `types.ts`. Compartilhado em `src/shared/`.
- **Routing:** Next.js App Router. Route groups: `src/app/(admin)/` protegido + `src/app/(public)/` loja anônima.
- **Server Components por default.** Client Components só quando precisar de interatividade (form com state, dialog, tabs controladas). Marca com `"use client"` no topo.
- **Mutações:** Server Actions (`"use server"`). Validação zod no início. Retorna `{ ok: true, data } | { ok: false, error }` para feedback consistente.
- **Queries:** funções em `queries.ts` que rodam no servidor. Não chamar `supabase.from(...)` diretamente em página — passar por uma função tipada do feature.
- **Tipos Supabase:** gerados via `pnpm db:gen`, vão pra `src/lib/supabase/database.types.ts`. Importar com `import type { Database } from "@/lib/supabase/database.types"`.
- **Mobile-first absoluto.** Cada componente testado em viewport 375×667 antes de desktop. Bottom-nav é navegação primária do admin.
- **Componentes shadcn/ui** copiados sob demanda em `src/components/ui/`. Não criar wrappers desnecessários.
- **Datas:** sempre `Date` no servidor, ISO string no transporte, `Intl.DateTimeFormat("pt-BR")` na exibição. Timezone: `America/Sao_Paulo`.
- **Dinheiro:** sempre `numeric(12, 2)` no Postgres, `string` no transporte (evita float drift), `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` na exibição. Helper em `src/shared/format/money.ts`.
- **Erros:** nunca silenciar. Server actions retornam erro tipado. Toast (sonner) exibe mensagem amigável pt-BR. Log técnico via `console.error` no server.
- **Testando Server Actions:** desde o suplemento Sprint 6, `vitest.config.ts` aliasa `server-only` → `src/test-stubs/server-only.ts` (vazio) e `vitest.setup.ts` mocka `next/cache` (`revalidatePath`/`revalidateTag`/`unstable_cache`). Isso permite importar Server Actions e queries server-side em testes (vitest/jsdom não tem contexto de request). Ao escrever testes que tocam DB, siga o padrão `RUN_DB_INTEGRATION=1` com cleanup no `afterAll` — exemplos em `src/features/{estoque,financeiro,loja}/integration.test.ts`.

## Comandos do projeto

```bash
pnpm install               # instalar dependências
pnpm dev                   # next dev na porta 3000
pnpm build                 # build de produção
pnpm lint                  # eslint
pnpm typecheck             # tsc --noEmit
pnpm test                  # vitest unit tests
pnpm e2e                   # playwright E2E
pnpm db:gen                # gera tipos do Supabase
pnpm db:migrate            # aplica migrations local (supabase db push)
pnpm db:reset              # reset DB local + seed
```

## Verificação antes de fechar tarefa

Use o ritual da skill `superpowers:verification-before-completion`:

1. `pnpm typecheck` passa
2. `pnpm lint` passa
3. `pnpm test` passa (testes unitários da feature tocada)
4. `pnpm build` passa
5. Funcionalidade testada manualmente em viewport mobile (375×667) e desktop (1280×800)
6. Documentar status atualizado no `docs/sprints/sprint-XX-*.md` da sprint corrente (seção "Progresso")

Nunca declare "feito" sem rodar acima e ver verde.

## Skills relevantes

- `superpowers:brainstorming` — antes de criar nova feature dentro de uma sprint
- `superpowers:writing-plans` — antes de implementar uma sprint complexa
- `superpowers:test-driven-development` — implementações novas com lógica de negócio
- `superpowers:executing-plans` — executar plano com checkpoints
- `superpowers:systematic-debugging` — qualquer bug
- `superpowers:verification-before-completion` — antes de declarar feito
- `superpowers:requesting-code-review` — antes de fechar sprint
- `andrej-karpathy-skills:karpathy-guidelines` — para evitar over-engineering

## O que NUNCA fazer

- Pular o bootstrap (ler overview + sprint atual). Mesmo se a tarefa parecer trivial.
- Adicionar features fora do escopo da sprint corrente sem perguntar.
- Mockar Supabase em testes. Use Supabase local (CLI) para testes de integração.
- Commitar `.env.local` ou qualquer chave.
- Usar `git push --force` em `main`.
- Aplicar migrations destrutivas (DROP, ALTER que muda tipo) sem confirmação explícita do usuário.
- Mudar stack/dependência major sem atualizar `docs/architecture/stack.md` no mesmo PR.
- Declarar sprint completa sem atualizar status em `docs/00-overview.md` e marcar checklist em `docs/sprints/sprint-XX-*.md`.

## Onde está o quê

```
sistema-oficina-pedrored/
├── CLAUDE.md                          # este arquivo
├── README.md                          # quickstart pra dev humano
├── docs/
│   ├── 00-overview.md                 # visão mestre — leia primeiro
│   ├── architecture/
│   │   ├── stack.md                   # versões + justificativas
│   │   ├── data-model.md              # schema vivo (atualizado por sprint)
│   │   └── deploy.md                  # Vercel + VPS Evolution + DNS
│   ├── decisions/                     # ADRs futuros (decisões grandes)
│   └── sprints/
│       ├── sprint-00-setup.md
│       ├── sprint-01-core-os.md
│       ├── sprint-02-financeiro.md
│       ├── sprint-03-estoque.md
│       ├── sprint-04-agenda.md
│       ├── sprint-05-whatsapp.md
│       ├── sprint-06-store.md
│       └── sprint-07-ia-analytics.md
├── src/                               # código (criado a partir do Sprint 0)
├── supabase/
│   ├── migrations/                    # .sql versionado
│   └── seed.sql                       # catálogo VW + dados de teste
└── package.json
```
