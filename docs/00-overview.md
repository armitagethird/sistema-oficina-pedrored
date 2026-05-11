# Sistema Oficina PedroRed — Visão Mestre

> **Documento canônico do projeto.** Toda sessão Claude lê este arquivo antes de qualquer ação (regra em `CLAUDE.md`).

## Status do roadmap

| # | Sprint | Status | Branch / PR | Validado por Pedro |
|---|--------|--------|-------------|---------------------|
| 0 | Setup | ✅ validada | main | ✅ Romero (proxy) 2026-05-11 |
| 1 | Core OS | 🟡 a iniciar | — | — |
| 2 | Financeiro | ⚪ pendente | — | — |
| 3 | Estoque | ⚪ pendente | — | — |
| 4 | Agenda | ⚪ pendente | — | — |
| 5 | WhatsApp (Evolution API) | ⚪ pendente | — | — |
| 6 | PedroRed Store (pública) | ⚪ pendente | — | — |
| 7 | IA + Dashboards | ⚪ pendente | — | — |

**Sprint corrente: 1 — Core OS.**

**Deploy de produção:** https://sistema-oficina-pedrored.vercel.app/ (Vercel, conectado a `armitagethird/sistema-oficina-pedrored` em GitHub).

Atualizar esta tabela ao fim de cada sprint (✅ validada / 🟢 implementada aguardando validação / 🟡 em andamento / 🔴 bloqueada / ⚪ pendente).

## Por que este projeto existe

Pedro é mecânico autônomo focado em linha Volkswagen TSI/MSI. Hoje opera com três dores principais:

1. **Bagunça financeira em peças sob encomenda.** Compra do fornecedor com dinheiro próprio, marca markup, vende ao cliente. Quando o cliente atrasa pagamento e há vários carros simultâneos na fila, perde o rastro de quem deve quanto.
2. **Sem controle de estoque** detalhado para óleo, filtros, pneus, rodas — vende à medida que precisa, sem visibilidade de margem ou alerta de mínimo.
3. **Demanda volátil** (1 carro hoje, 6 amanhã) sem agenda nem comunicação estruturada com clientes (tudo via WhatsApp manual).

Fontes de receita extras: links de afiliado Mercado Livre que envia para clientes (cliente compra direto, Pedro recebe comissão).

**Resultado pretendido:** sistema web Next.js (mobile-first, instalável como PWA) que cobre desde gestão básica até analytics com IA, entregue em 8 sprints validáveis individualmente.

## Decisões fechadas (não revisitar sem motivo forte)

| Tema | Decisão | Sprint que materializa |
|------|---------|------------------------|
| Stack web | Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui | 0 |
| Banco / Auth / Storage | Supabase (Postgres + Auth + Storage). Single tenant. | 0 |
| Hospedagem app | Vercel (free tier inicialmente) | 0 |
| Hospedagem Evolution API | VPS Hostgator (Docker) | 5 |
| Arquitetura geral | Monolito Next.js único. Loja pública e admin no mesmo app via route groups `(admin)` e `(public)`. **Não monorepo.** | 0 |
| Usuários internos | Single-user (só Pedro). Auth Supabase email+senha. Sem roles complexas. | 0 |
| PWA | Sim, instalável (manifest + service worker básico via `@ducanh2912/next-pwa`) | 0 |
| Idioma UI | pt-BR. Identificadores no código em inglês exceto entidades de domínio. | 0 |
| Catálogo veículos | Híbrido — catálogo VW pré-cadastrado (Gol, Polo, T-Cross, Nivus, Virtus, Jetta, Tiguan, Taos, etc + motores 1.0/1.4 TSI, 1.6 MSI) + permite custom para modelo raro. | 0 |
| OS — campos | Básicos + serviços itemizados (mão de obra) + peças itemizadas (custo+venda) + fotos antes/depois (Supabase Storage) + quilometragem entrada/saída. | 1 |
| Pagamento cliente | À vista (PIX/dinheiro) + parcelado informal (data prevista por parcela) + sinal antecipado para encomenda. **Cartão fica para futuro.** | 2 |
| Mercado Livre afiliado | Cliente compra direto via link enviado por Pedro. Sistema rastreia link enviado + comissão esperada. | 2 |
| Estoque | Básico + auto-baixa quando peça é alocada em OS. Histórico de movimentação por OS. | 3 |
| Agenda | Dia + janela manhã/tarde (sem slots por hora — combina com fluxo real de Pedro). | 4 |
| WhatsApp automático | (a) lembrete D-1 agendamento, (b) OS pronta para retirar, (c) cobrança parcela atrasada (3/7/15 dias), (d) lembrete próxima troca de óleo por km. | 5 |
| Loja pública (PedroRed Store) | Catálogo + carrinho + checkout PIX (gera QR estático Pedro). Anônima (sem cadastro de cliente). Confirmação manual de Pedro. | 6 |
| IA analytics | Provider-agnostic. Default: Gemini 2.5 Flash Lite (custo ~zero). Insights: faturamento+lucro, ranking peças/serviços, previsão demanda, chat conversacional. | 7 |

## Arquitetura macro

```
┌────────────────────────────────────────────────────────────────────┐
│  Vercel ──────────────────────────────────────────────────         │
│  Next.js 15 App Router (mobile-first PWA)                          │
│  ├─ src/app/(admin)/         → protegido, Pedro logado             │
│  │   ├─ page.tsx (dashboard)                                       │
│  │   ├─ os/, clientes/, veiculos/, estoque/, agenda/, ia/          │
│  ├─ src/app/(public)/        → loja anônima                        │
│  │   ├─ page.tsx (home/catálogo)                                   │
│  │   ├─ produto/[slug]/, carrinho/, checkout/                      │
│  ├─ src/app/login/                                                 │
│  └─ src/app/api/             → route handlers (webhooks Evolution) │
└──────────┬────────────────────────────┬────────────────────────────┘
           │                            │
           ▼                            ▼
┌────────────────────┐         ┌─────────────────────────┐
│ Supabase            │        │ VPS Hostgator (Docker)  │
│ - Postgres          │        │ - Evolution API         │
│ - Auth (Pedro)      │        │ - Postgres+Redis Evol   │
│ - Storage (fotos OS)│        │ - Webhook → Vercel      │
│ - RLS               │        └────────────┬────────────┘
└────────────────────┘                      │
           ▲                                │
           │                                ▼
           └────────── Webhooks ────► /api/whatsapp/webhook
                       (recebimento msgs cliente)
```

### Princípios de boundaries

- Cada subsistema vira pasta isolada em `src/features/{ordens, estoque, financeiro, agenda, whatsapp, loja, analytics, clientes, veiculos}`.
- Cada feature exporta uma API pública via `index.ts` (componentes principais + tipos). Nada de import deep paths fora da própria feature.
- Compartilhado em `src/shared/` (helpers de formato, hooks genéricos, UI primitivos não-shadcn).
- Schema do banco em `supabase/migrations/` é a **fonte única da verdade** — tipos TS gerados, nunca mantidos manualmente.

## Ordem das sprints (e por quê)

1. **Sprint 0 — Setup.** Fundação: Next + Supabase + auth + shell mobile + schema base (clientes/veículos). Sem ela nada existe.
2. **Sprint 1 — Core OS.** Operação básica do dia-a-dia. Pedro precisa abrir/listar/atualizar OS antes de pensar em qualquer outra coisa.
3. **Sprint 2 — Financeiro.** **Dor #1.** Resolve confusão de peças sob encomenda + parcelas + ML afiliado. Maior ganho percebido.
4. **Sprint 3 — Estoque.** Conecta com OS via auto-baixa. Visibilidade de margem e alerta mínimo.
5. **Sprint 4 — Agenda.** Manhã/tarde + visão fila do dia. Resolve volatilidade de demanda.
6. **Sprint 5 — WhatsApp.** Automatiza comunicação que hoje é manual. Depende de agenda + OS + financeiro existentes pra disparar nas situações certas.
7. **Sprint 6 — PedroRed Store.** Vitrine pública pra expandir vendas. Depende de estoque + financeiro consolidados.
8. **Sprint 7 — IA + Dashboards.** Por último porque precisa de dados acumulados. Sem dados, IA não tem o que analisar.

**Regra de transição:** sprint só termina quando Pedro testou no celular dele com dados reais e aprovou. Atualize o status na tabela acima e marque "Definition of Done" no `docs/sprints/sprint-XX-*.md` correspondente.

## Como começar / continuar

1. Sessão nova (Claude foi resetado entre sprints):
   - Leia `CLAUDE.md` raiz
   - Leia este `docs/00-overview.md`
   - Leia `docs/architecture/stack.md` + `docs/architecture/data-model.md`
   - Identifique sprint corrente (tabela acima)
   - Leia `docs/sprints/sprint-XX-*.md` correspondente
   - Comece pelo "Tasks" da sprint
2. Continuar sprint em andamento: vá direto pro `docs/sprints/sprint-XX-*.md` da sprint corrente.

## Convenções de status sprint

- ⚪ **Pendente** — ainda não iniciada.
- 🟡 **Em andamento** — branch criada, código sendo escrito.
- 🟢 **Implementada** — código pronto, CI verde, aguardando validação manual de Pedro.
- ✅ **Validada** — Pedro testou no celular dele e aprovou.
- 🔴 **Bloqueada** — algo externo impede progresso (anote no sprint .md em "Bloqueios").

## Atualizando este documento

- **Status do roadmap:** atualize ao mudar status de qualquer sprint.
- **Decisões fechadas:** só adicione entrada nova se uma decisão arquitetural foi tomada explicitamente. Mudança de decisão antiga requer ADR em `docs/decisions/`.
- **Arquitetura macro:** atualize se topologia de deploy mudar (ex: adicionar workers, jobs, segundo serviço).
