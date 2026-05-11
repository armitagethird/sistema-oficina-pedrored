# Sprint 7 — IA + Dashboards (analytics)

> **Self-contained.** Leia também `CLAUDE.md`, `docs/00-overview.md`, `docs/architecture/{stack,data-model}.md`. Sprints 0–6 ✅.

## Status

⚪ Pendente.

## Contexto

Sprints 0–6 acumulam dados ricos: OS, peças, serviços, pagamentos, estoque, agenda, WhatsApp, pedidos da loja. Esta sprint extrai valor desses dados via:

1. **Dashboards gráficos** — visualizações pré-configuradas com filtros de período.
2. **Insights** automáticos — cards prontos com "top peça do mês", "cliente que mais paga atrasado", "previsão semana".
3. **Chat conversacional com IA** — Pedro digita pergunta em linguagem natural ("quanto fechei essa semana?", "quem está me devendo?", "que peças vendem mais no T-Cross?"), IA responde com dados reais consultados do banco.

Provider IA é **provider-agnostic** (interface abstrai). Default: **Gemini 2.5 Flash Lite** pelo custo ~zero. Alternativas plugáveis: OpenAI GPT-4o-mini, NVIDIA NIM hospedado.

## Pré-requisitos

- Sprints 0–6 ✅.
- Pedro tem ≥ 30 dias de dados reais no sistema (mínimo viável pra insights úteis).
- API key do provider escolhido em env vars (`GEMINI_API_KEY` por default).
- `ANALYTICS_PROVIDER=gemini` (ou `openai`, `nvidia`) em env vars.

## Objetivo

1. `/app/dashboard` enriquecido com cards de KPI + gráficos:
   - Faturamento últimos 30 dias (linha + comparação vs mês anterior)
   - Lucro estimado (faturamento - custo peças - custo fornecedor)
   - OS por status pizza
   - Peças mais vendidas (top 10 do mês)
   - Serviços mais executados (top 10 do mês)
   - Clientes que mais geram receita (top 5)
   - Inadimplência (% contas atrasadas, valor)
2. `/app/insights` — cards prontos com análises:
   - "Você fez R$ X esta semana, +Y% vs semana anterior"
   - "3 carros chegam manhã amanhã — sua agenda mais cheia do mês"
   - "Cliente Z é seu top do mês com R$ W"
   - "Item Y abaixo do mínimo há 2 semanas — recomendamos comprar"
   - "Peça X tem margem média 45% e vende muito — ótima posição"
3. `/app/ia` — chat conversacional:
   - Pedro digita pergunta livre
   - IA usa **function calling** pra consultar banco (queries pré-definidas seguras)
   - Responde texto + opcionalmente gráfico embutido
   - Histórico salvo em `analytics_chat_msgs`
4. Cron diário 03:00 BRT refresha materialized views.

## Decisões já tomadas

- Interface `AnalyticsProvider` em `src/features/analytics/providers/` com implementações: `GeminiProvider`, `OpenAIProvider`, `NvidiaProvider`. Seleção via `process.env.ANALYTICS_PROVIDER`.
- IA recebe **apenas dados agregados** (nunca chave PIX, CPF, dados sensíveis). Function calling expõe ~10 funções específicas e seguras (`getFaturamentoPeriodo`, `getTopPecas`, `getClientesInadimplentes`, etc).
- Chat tem rate limit: 30 perguntas/dia (config em settings). Evita estourar quota do provider.
- Insights cards: computados via SQL (materialized views) — não chamam IA. IA usa pra chat conversacional.
- Recharts pra todos os gráficos (já no projeto desde Sprint 2).
- Streaming response no chat (Vercel AI SDK opcional, ou fetch streaming manual).

## Stack desta sprint

```bash
pnpm add ai                          # Vercel AI SDK — abstração streaming + tool calling
pnpm add @ai-sdk/google              # provider Gemini para AI SDK
pnpm add @ai-sdk/openai              # provider OpenAI (opcional, instalar se precisar)
pnpm add recharts                    # já instalado
pnpm add date-fns                    # já instalado
```

shadcn adicional:
```bash
npx shadcn@latest add chart          # shadcn chart helper (recharts wrapper)
```

## Schema delta — `supabase/migrations/20260901000000_init_analytics.sql`

```sql
-- Chat conversacional
create table analytics_chat_sessoes (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create trigger trg_chat_sessoes_atualizado_em before update on analytics_chat_sessoes
  for each row execute function set_atualizado_em();

create table analytics_chat_msgs (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null references analytics_chat_sessoes(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool')),
  conteudo text not null,
  tool_calls jsonb,
  tokens_input int,
  tokens_output int,
  criado_em timestamptz not null default now()
);
create index idx_chat_msgs_sessao on analytics_chat_msgs(sessao_id, criado_em);

-- Materialized views
create materialized view mv_faturamento_diario as
select
  os.fechado_em::date as dia,
  count(*) as os_fechadas,
  sum(os.total_geral) as faturamento_bruto,
  sum(os.total_servicos) as faturamento_servicos,
  sum(os.total_pecas) as faturamento_pecas,
  (
    sum(os.total_geral) - coalesce(sum((
      select sum(p.custo_unitario * p.quantidade) from os_pecas p where p.os_id = os.id
    )), 0)
  ) as lucro_bruto_estimado
from ordens_servico os
where os.status = 'entregue' and os.deletado_em is null
group by os.fechado_em::date;
create unique index ux_mv_fat_diario_dia on mv_faturamento_diario(dia);

create materialized view mv_faturamento_mensal as
select
  date_trunc('month', os.fechado_em)::date as mes,
  count(*) as os_fechadas,
  sum(os.total_geral) as faturamento_bruto,
  sum(os.total_servicos) as faturamento_servicos,
  sum(os.total_pecas) as faturamento_pecas,
  (
    sum(os.total_geral) - coalesce(sum((
      select sum(p.custo_unitario * p.quantidade) from os_pecas p where p.os_id = os.id
    )), 0)
  ) as lucro_bruto_estimado
from ordens_servico os
where os.status = 'entregue' and os.deletado_em is null
group by date_trunc('month', os.fechado_em);
create unique index ux_mv_fat_mensal_mes on mv_faturamento_mensal(mes);

create materialized view mv_ranking_pecas as
select
  p.descricao,
  count(*) as vezes_vendida,
  sum(p.quantidade) as quantidade_total,
  sum(p.preco_venda_unitario * p.quantidade) as receita_total,
  sum((p.preco_venda_unitario - p.custo_unitario) * p.quantidade) as margem_total,
  avg(p.preco_venda_unitario - p.custo_unitario) as margem_media_unitaria
from os_pecas p
join ordens_servico os on os.id = p.os_id
where os.status = 'entregue' and os.deletado_em is null
group by p.descricao
order by receita_total desc;

create materialized view mv_ranking_servicos as
select
  s.descricao,
  count(*) as vezes_executado,
  sum(s.quantidade) as quantidade_total,
  sum(s.valor_unitario * s.quantidade) as receita_total
from os_servicos s
join ordens_servico os on os.id = s.os_id
where os.status = 'entregue' and os.deletado_em is null
group by s.descricao
order by receita_total desc;

create materialized view mv_clientes_top as
select
  c.id as cliente_id,
  c.nome,
  count(distinct os.id) as ordens_concluidas,
  sum(os.total_geral) as receita_total,
  max(os.fechado_em) as ultima_visita
from clientes c
join ordens_servico os on os.cliente_id = c.id
where os.status = 'entregue' and os.deletado_em is null and c.deletado_em is null
group by c.id, c.nome
order by receita_total desc;
create unique index ux_mv_clientes_top on mv_clientes_top(cliente_id);

create materialized view mv_alertas_clientes as
select
  c.id as cliente_id,
  c.nome,
  c.telefone,
  -- sem visita há > 6 meses?
  (current_date - max(os.fechado_em)::date) as dias_sem_visita,
  -- parcelas atrasadas?
  (
    select count(*) from pagamentos p
    join ordens_servico os2 on os2.id = p.os_id
    where os2.cliente_id = c.id and p.status = 'atrasado'
  ) as parcelas_atrasadas,
  -- estimativa de carro precisando troca de óleo?
  (
    select count(*) from veiculos v
    where v.cliente_id = c.id
      and v.km_proxima_troca_oleo is not null
      and v.km_proxima_troca_oleo - coalesce(v.km_atual, 0) < 1000
  ) as veiculos_com_oleo_proximo
from clientes c
left join ordens_servico os on os.cliente_id = c.id and os.status = 'entregue'
where c.deletado_em is null
group by c.id, c.nome, c.telefone;

-- Função pra refresh
create or replace function refresh_analytics_mvs()
returns void as $$
begin
  refresh materialized view concurrently mv_faturamento_diario;
  refresh materialized view concurrently mv_faturamento_mensal;
  refresh materialized view mv_ranking_pecas;
  refresh materialized view mv_ranking_servicos;
  refresh materialized view concurrently mv_clientes_top;
  refresh materialized view mv_alertas_clientes;
end;
$$ language plpgsql;

-- Settings adicionais
insert into settings (chave, valor) values
  ('analytics_chat_rate_limit_dia', '30'::jsonb),
  ('analytics_provider', '"gemini"'::jsonb);

-- RLS
alter table analytics_chat_sessoes enable row level security;
create policy "chat_sessoes_authenticated_all" on analytics_chat_sessoes
  for all to authenticated using (true) with check (true);

alter table analytics_chat_msgs enable row level security;
create policy "chat_msgs_authenticated_all" on analytics_chat_msgs
  for all to authenticated using (true) with check (true);
```

## Estrutura — delta

```
src/
├── app/(admin)/app/
│   ├── page.tsx                              # dashboard enriquecido (Sprint 7 atualiza)
│   ├── insights/page.tsx                     # cards de insights gerados via SQL/heurística
│   └── ia/
│       ├── page.tsx                          # chat conversacional
│       ├── [sessaoId]/page.tsx               # histórico de sessão específica
│       └── actions.ts                        # createSessao, sendMessage (streaming)
├── app/api/
│   ├── ia/chat/route.ts                      # endpoint streaming pra chat (POST)
│   └── cron/analytics/refresh-mvs/route.ts   # 03:00 BRT diário
├── features/analytics/
│   ├── queries.ts                            # faturamento, ranking, top clientes, alertas
│   ├── insights.ts                           # heurísticas pra gerar texto de insights
│   ├── schemas.ts, types.ts
│   ├── providers/
│   │   ├── index.ts                          # factory baseado em ANALYTICS_PROVIDER
│   │   ├── types.ts                          # interface AnalyticsProvider
│   │   ├── gemini.ts
│   │   ├── openai.ts
│   │   └── nvidia.ts
│   ├── tools/                                # functions disponíveis para IA via tool calling
│   │   ├── index.ts                          # lista exportada
│   │   ├── get-faturamento-periodo.ts
│   │   ├── get-top-pecas.ts
│   │   ├── get-top-servicos.ts
│   │   ├── get-clientes-inadimplentes.ts
│   │   ├── get-agenda-proximos-dias.ts
│   │   ├── get-estoque-abaixo-minimo.ts
│   │   ├── get-veiculos-com-revisao-prox.ts
│   │   └── README.md                         # documenta cada tool, params, retorno
│   └── components/
│       ├── kpi-card.tsx
│       ├── grafico-faturamento.tsx           # linha 30 dias
│       ├── grafico-lucro-vs-fatura.tsx
│       ├── grafico-os-status-pizza.tsx
│       ├── ranking-pecas-table.tsx
│       ├── ranking-servicos-table.tsx
│       ├── clientes-top-list.tsx
│       ├── insight-card.tsx
│       ├── insights-grid.tsx
│       ├── chat-messages.tsx
│       ├── chat-input.tsx
│       ├── chat-tool-call-badge.tsx          # mostra "consultou faturamento"
│       └── chat-thinking-indicator.tsx
└── shared/lib/
    └── (cron-auth.ts já existente)
```

## Tasks ordenadas

### Schema

1. Migration `20260901000000_init_analytics.sql`.
2. `supabase db push`. `pnpm db:gen`.
3. Rodar `refresh_analytics_mvs()` manualmente uma vez pra popular MVs.

### Provider abstraction

4. `providers/types.ts` — interface:
   ```ts
   interface AnalyticsProvider {
     generateText(opts: GenerateOpts): Promise<string>
     streamText(opts: StreamOpts): AsyncIterable<TextPart>
   }
   interface GenerateOpts {
     model?: string
     system: string
     messages: ChatMessage[]
     tools?: ToolDef[]
   }
   ```
5. `providers/gemini.ts` — implementa usando `@ai-sdk/google`.
6. `providers/openai.ts` — implementa usando `@ai-sdk/openai` (opcional, instalar quando trocar).
7. `providers/index.ts` — `getProvider()` retorna instância baseado em `process.env.ANALYTICS_PROVIDER`.

### Tools (function calling)

8. Cada tool em `tools/*.ts` exporta:
   - `name` (ex: `get_faturamento_periodo`)
   - `description` (em pt-BR — IA usa pra escolher)
   - `inputSchema` zod
   - `execute(input)` — chama queries do Supabase, retorna dados estruturados (não strings)
9. `tools/index.ts` agrega e exporta lista.
10. Cada tool documentada em `tools/README.md`.

### Chat endpoint

11. `/api/ia/chat/route.ts`:
    - POST com `{ sessaoId, mensagem }`
    - Salva mensagem `user`
    - Rate limit check (count msgs hoje por sessao OU global; usa setting)
    - Carrega histórico (últimas 20 msgs)
    - Chama `provider.streamText({ system, messages, tools })`
    - System prompt em pt-BR: "Você é assistente de Pedro, mecânico VW. Use as ferramentas pra consultar dados reais. Responda em pt-BR conciso. Nunca invente números — sempre consulte."
    - Stream chunks de volta + executa tool calls quando provider pedir
    - Ao final, salva mensagem `assistant` + tool_calls
12. `actions.ts` no `/app/ia` — `createSessao`, `listSessoes`, helper pra usar EventSource/streaming no client.

### Queries / insights / dashboard

13. `analytics/queries.ts` — funções que leem MVs (`getFaturamentoUltimos30Dias`, `getRankingPecasMes`, `getClientesTopMes`, `getAlertas`).
14. `analytics/insights.ts` — funções que **geram texto** a partir dos dados (sem IA — heurísticas):
    - `insightFaturamentoSemana` — compara com semana anterior
    - `insightAgendaSemana` — destaca dia mais cheio
    - `insightInadimplencia`
    - `insightOleoProximos` — usa `mv_alertas_clientes`
    - `insightTopCliente`
    - `insightEstoqueBaixo`
    - `insightPecaMaisVendida`
15. Componentes de gráfico (recharts via shadcn `chart`).
16. Páginas:
    - `/app/page.tsx` atualiza com novos KPI cards + gráficos
    - `/app/insights` lista cards
    - `/app/ia` chat principal

### Cron refresh MVs

17. `/api/cron/analytics/refresh-mvs/route.ts` — GET protegido, `supabase.rpc('refresh_analytics_mvs')`.
18. Atualizar `vercel.json` com schedule `0 6 * * *` (06:00 UTC = 03:00 BRT).

### Bottom-nav

19. Item "IA" no menu "Mais".

### Testes

20. Vitest:
    - Cada `insights.ts` heurística com dados mock retorna texto esperado
    - Cada tool valida input zod e roda contra Supabase test
21. Playwright:
    - Abre `/app/ia`, manda "quanto fechei esta semana?", IA responde número correto vinculado a dados seed
    - Recusa fora de escopo: "qual o CPF do cliente X?" → recusa educadamente
    - Rate limit: simular 31 perguntas → 31ª falha

### Documentação

22. Atualizar `data-model.md` com MVs.
23. Atualizar `deploy.md` cron novo + var `GEMINI_API_KEY`.
24. Atualizar `00-overview.md` Sprint 7 → 🟢, depois ✅.

## Critical files

- `supabase/migrations/20260901000000_init_analytics.sql`
- `src/features/analytics/**`
- `src/app/(admin)/app/{page,insights,ia}/**`
- `src/app/api/ia/chat/route.ts`
- `src/app/api/cron/analytics/refresh-mvs/route.ts`
- `vercel.json`

## Skills

- `claude-api` ou skill equivalente do provider (Gemini não tem skill — usar docs oficial)
- `superpowers:writing-plans`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`

## Verificação

### Automatizada

- [ ] typecheck/lint/test/e2e/build verdes
- [ ] Migration aplica, MVs populadas
- [ ] Refresh function roda sem erro
- [ ] Provider Gemini retorna texto não-vazio em teste de smoke
- [ ] Cada tool retorna dados válidos contra fixture

### Manual (dev)

- [ ] Dashboard mostra gráficos com dados reais
- [ ] Insights page tem 5-7 cards relevantes
- [ ] Chat: "quanto fechei esta semana?" — IA chama tool, responde número
- [ ] Chat: "quais 3 peças vendem mais?" — IA chama tool ranking, responde lista
- [ ] Chat: "quem está atrasado com pagamento?" — IA lista clientes corretos
- [ ] Chat: pergunta absurda ("qual a capital da França?") — IA recusa e foca no domínio
- [ ] Rate limit funciona após 30 perguntas
- [ ] Histórico de sessões persistente
- [ ] Toggle provider via env (trocar `ANALYTICS_PROVIDER` pra openai com chave válida e ver funcionar)

### Manual (Pedro)

- [ ] Pedro abre dashboard e vê visão clara do mês
- [ ] Lê insights, alguns reagem com "verdade, não percebi isso"
- [ ] Faz 5-10 perguntas pro chat com dados reais
- [ ] Confirma "agora tenho noção do meu negócio" via WhatsApp

## Definition of Done

1. Verificação completa
2. `00-overview.md` Sprint 7 = ✅
3. Sistema **inteiro** considerado finalizado v1.0
4. Pedro validou tudo

## Fora de escopo

- Previsão preditiva avançada (ML real, séries temporais) — heurísticas simples bastam
- Multi-tenant analytics
- Export PDF/Excel formal (pode entrar pós-v1.0)
- Anomalias automáticas via ML
- Comparativo com benchmarks de mercado
- Voice input no chat
- Geração de imagens / relatórios visuais via IA

## Bloqueios

(adicione — dúvida: custo Gemini Flash Lite mesmo é zero? Confirmar antes de produção)

## Progresso

(atualize)

## Referências

- Vercel AI SDK: https://sdk.vercel.ai
- Gemini API: https://ai.google.dev/gemini-api/docs
- @ai-sdk/google: https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai
- Postgres materialized views: https://www.postgresql.org/docs/current/sql-creatematerializedview.html
- Recharts: https://recharts.org
