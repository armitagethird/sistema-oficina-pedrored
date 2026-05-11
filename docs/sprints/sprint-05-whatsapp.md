# Sprint 5 — WhatsApp via Evolution API

> **Self-contained.** Leia também `CLAUDE.md`, `docs/00-overview.md`, `docs/architecture/{stack,data-model,deploy}.md`. Sprints 0–4 ✅.

## Status

⚪ Pendente.

## Contexto

Pedro hoje conversa com clientes manualmente via WhatsApp. Avisa OS pronta, cobra atraso, manda lembrete de óleo. Tempo perdido + esquecimento frequente.

Esta sprint conecta o sistema com WhatsApp via **Evolution API self-hosted na VPS Hostgator** e automatiza 4 fluxos:

1. **Lembrete D-1** — véspera do agendamento dispara mensagem de confirmação.
2. **OS pronta pra retirar** — quando status OS muda pra `pronta`, manda valor + chave PIX.
3. **Cobrança parcela atrasada** — cron diário avisa quando parcela passa 3, 7, 15 dias do prazo.
4. **Lembrete próxima troca de óleo (por km)** — baseado em km registrado em OS anterior + intervalo configurável, manda lembrete quando estima que próxima troca está chegando.

Adicionalmente: envio manual de mensagem do detalhe da OS, envio rápido de link ML afiliado pra cliente, recebimento de mensagens (apenas log inicialmente — automação de resposta fica fora do MVP).

## Pré-requisitos

- Sprint 1 ✅ (OS) e Sprint 2 ✅ (pagamentos) e Sprint 4 ✅ (agenda).
- VPS Hostgator contratada com Docker + Docker Compose instalados.
- Subdomínio `wa.pedrored.com.br` apontando para IP da VPS, com SSL (Let's Encrypt).
- Número WhatsApp dedicado pra Pedro usar com Evolution (não pode ser o mesmo número que usa WhatsApp normal — Evolution pega controle do número).
  - Recomendação: chip novo (R$10), número exclusivo da oficina.
- Variáveis adicionadas em Vercel:
  - `EVOLUTION_API_URL=https://wa.pedrored.com.br`
  - `EVOLUTION_API_KEY=<gerada na config Evolution>`
  - `EVOLUTION_INSTANCE_NAME=pedrored`

## Objetivo

1. Evolution API rodando estável na VPS, número Pedro pareado via QR.
2. Tela `/app/whatsapp` mostra status conexão (verde/vermelho) + último ping.
3. Painel de templates: visualizar e editar mensagens com placeholders.
4. Envio manual do detalhe OS: botão "Enviar PIX por WhatsApp" preview + confirma.
5. 4 fluxos automáticos rodando via Vercel Cron:
   - Lembrete D-1 (18h diário) → manda pra clientes com agendamento `data = amanhã` e `status in ('agendado','confirmado')`
   - OS pronta → dispara quando server action `mudarStatus(osId, 'pronta')` é chamada
   - Cobrança atraso (10h diário) → cron procura parcelas com `status = 'atrasado'` e `dias_atraso in (3, 7, 15)` (uma vez por marco)
   - Lembrete óleo km (11h segunda) → cron processa veículos com última troca de óleo registrada + diff de km estimado
6. Recebimento via webhook salva mensagem em `whatsapp_msgs` com `direcao = 'in'`. Tela `/app/whatsapp/conversas` lista por cliente (apenas leitura).
7. Toggle global "pausar envios automáticos" (kill-switch em caso de bug — guarda em `settings`).

## Decisões já tomadas

- Evolution API self-hosted (vs gerenciado) — controle total, custo baixo.
- Templates ficam em DB editável (não hardcoded). Pedro pode ajustar redação sem deploy.
- Placeholders suportados: `{{nome}}`, `{{primeiro_nome}}`, `{{data}}`, `{{periodo}}`, `{{valor}}`, `{{pix_chave}}`, `{{os_numero}}`, `{{km_estimado}}`, `{{dias_atraso}}`.
- Kill-switch — `settings.chave = 'whatsapp_envios_ativos'` valor `true` por default. Cron jobs checam antes.
- Job idempotency — cada cron registra log em `whatsapp_jobs_cron` com `(tipo, data_alvo, alvo_id)` UNIQUE. Não re-envia se job já rodou.
- Lembrete óleo km: precisa coluna `km_proxima_troca_oleo` estimado por veículo. Cron checa veículos com OS recente onde Pedro marcou "trocou óleo" (campo a adicionar em `os_servicos` ou marcação manual no veículo). MVP: campo manual `km_proxima_troca_oleo` em `veiculos`, Pedro preenche.

## Stack desta sprint

```bash
# Sem SDK específico, fetch direto
# Util pra parse webhooks
pnpm add zod                      # já no projeto
```

shadcn adicional:
```bash
npx shadcn@latest add switch toggle skeleton scroll-area
```

## Infra Evolution — `infra/evolution/`

Estrutura no repositório (não deployado pela Vercel — apenas docs+config):

```
infra/evolution/
├── docker-compose.yml
├── .env.example
├── caddy/
│   └── Caddyfile                # proxy reverso + SSL Let's Encrypt
└── RUNBOOK.md                   # como subir, restart, logs, recuperação
```

`docker-compose.yml` reference (adaptar conforme última versão Evolution):

```yaml
version: '3.9'
services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: unless-stopped
    environment:
      - SERVER_URL=https://wa.pedrored.com.br
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgres://evo:${POSTGRES_PASSWORD}@postgres:5432/evolution
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_URL=https://pedrored.vercel.app/api/whatsapp/webhook
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
    depends_on: [postgres, redis]
    networks: [evo]
    ports: ["8080:8080"]

  postgres:
    image: postgres:16-alpine
    container_name: evo-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: evolution
      POSTGRES_USER: evo
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - evo-pgdata:/var/lib/postgresql/data
    networks: [evo]

  redis:
    image: redis:7-alpine
    container_name: evo-redis
    restart: unless-stopped
    volumes:
      - evo-redisdata:/data
    networks: [evo]

  caddy:
    image: caddy:2-alpine
    container_name: evo-caddy
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    networks: [evo]

networks: { evo: }
volumes: { evo-pgdata: , evo-redisdata: , caddy-data: , caddy-config: }
```

`caddy/Caddyfile`:

```
wa.pedrored.com.br {
    reverse_proxy evolution-api:8080
}
```

## Schema delta — `supabase/migrations/20260715000000_init_whatsapp.sql`

```sql
-- Enums
create type whatsapp_direcao as enum ('in', 'out');
create type whatsapp_msg_status as enum ('pendente', 'enviada', 'entregue', 'lida', 'falhou');
create type whatsapp_template_tipo as enum (
  'lembrete_d1', 'os_pronta', 'cobranca_atraso_3', 'cobranca_atraso_7',
  'cobranca_atraso_15', 'lembrete_oleo_km', 'manual'
);
create type whatsapp_job_tipo as enum (
  'lembrete_d1', 'cobranca_atraso', 'lembrete_oleo_km'
);

-- Templates editáveis
create table whatsapp_templates (
  tipo whatsapp_template_tipo primary key,
  template_texto text not null,
  ativo bool not null default true,
  descricao text,
  atualizado_em timestamptz not null default now()
);

insert into whatsapp_templates (tipo, template_texto, descricao) values
  ('lembrete_d1',
   'Olá {{primeiro_nome}}! Lembrete do seu agendamento na PedroRed amanhã ({{data}}, {{periodo}}). Confirma?',
   'Mensagem enviada 1 dia antes do agendamento'),
  ('os_pronta',
   'Olá {{primeiro_nome}}, seu carro está pronto pra retirar! 🚗 Valor total: {{valor}}. Chave PIX: {{pix_chave}}',
   'Disparado quando OS muda pra status "pronta"'),
  ('cobranca_atraso_3',
   'Oi {{primeiro_nome}}, tudo certo? Vi que tem uma parcela de {{valor}} que venceu há {{dias_atraso}} dias. Conseguimos resolver?',
   'Cobrança suave aos 3 dias de atraso'),
  ('cobranca_atraso_7',
   '{{primeiro_nome}}, segunda lembrança: parcela de {{valor}} atrasada {{dias_atraso}} dias. PIX: {{pix_chave}}. Qualquer dificuldade me avisa.',
   'Cobrança aos 7 dias'),
  ('cobranca_atraso_15',
   '{{nome}}, preciso falar contigo sobre a parcela de {{valor}} ({{dias_atraso}} dias em atraso). Me dá um retorno por favor.',
   'Cobrança aos 15 dias'),
  ('lembrete_oleo_km',
   'E aí {{primeiro_nome}}! Olhando aqui, seu carro deve estar perto de {{km_estimado}} km — hora da troca de óleo. Marca um horário?',
   'Lembrete baseado em estimativa de km'),
  ('manual', '{{texto}}', 'Mensagem manual livre');

-- Mensagens (log de tudo enviado e recebido)
create table whatsapp_msgs (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  telefone text not null,
  direcao whatsapp_direcao not null,
  template_tipo whatsapp_template_tipo,
  conteudo text not null,
  status whatsapp_msg_status not null default 'pendente',
  evolution_msg_id text,
  os_id uuid references ordens_servico(id) on delete set null,
  agendamento_id uuid references agendamentos(id) on delete set null,
  pagamento_id uuid references pagamentos(id) on delete set null,
  payload_raw jsonb,
  erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_wa_msgs_cliente on whatsapp_msgs(cliente_id) where cliente_id is not null;
create index idx_wa_msgs_telefone on whatsapp_msgs(telefone);
create index idx_wa_msgs_direcao on whatsapp_msgs(direcao);
create index idx_wa_msgs_criado on whatsapp_msgs(criado_em desc);
create trigger trg_wa_msgs_atualizado_em before update on whatsapp_msgs
  for each row execute function set_atualizado_em();

-- Log execução de jobs (idempotency)
create table whatsapp_jobs_cron (
  id uuid primary key default gen_random_uuid(),
  tipo whatsapp_job_tipo not null,
  alvo_id uuid not null,                       -- agendamento_id, pagamento_id, ou veiculo_id
  marco text,                                  -- ex: 'd-1', '3_dias', '7_dias', '15_dias'
  msg_id uuid references whatsapp_msgs(id) on delete set null,
  sucesso bool not null,
  erro text,
  criado_em timestamptz not null default now(),
  unique (tipo, alvo_id, marco)
);

-- Settings adicionais
insert into settings (chave, valor) values
  ('whatsapp_envios_ativos', 'true'::jsonb),
  ('whatsapp_oleo_km_intervalo', '10000'::jsonb),     -- km entre trocas (default 10k)
  ('whatsapp_oleo_km_antecedencia', '500'::jsonb);    -- avisar quando faltar 500 km

-- Campos novos em veiculos pra estimar próxima troca de óleo
alter table veiculos
  add column km_ultima_troca_oleo int,
  add column data_ultima_troca_oleo date,
  add column km_proxima_troca_oleo int;                -- calculado/atualizado manual

-- RLS
alter table whatsapp_templates enable row level security;
create policy "wa_templates_authenticated_all" on whatsapp_templates
  for all to authenticated using (true) with check (true);

alter table whatsapp_msgs enable row level security;
create policy "wa_msgs_authenticated_all" on whatsapp_msgs
  for all to authenticated using (true) with check (true);

alter table whatsapp_jobs_cron enable row level security;
create policy "wa_jobs_authenticated_all" on whatsapp_jobs_cron
  for all to authenticated using (true) with check (true);
```

## Estrutura — delta

```
src/
├── app/(admin)/app/whatsapp/
│   ├── page.tsx                              # status conexão + KPIs
│   ├── conversas/
│   │   ├── page.tsx                          # lista clientes ordenado por última msg
│   │   └── [clienteId]/page.tsx              # histórico conversa (somente leitura MVP)
│   ├── templates/
│   │   ├── page.tsx                          # lista
│   │   └── [tipo]/page.tsx                   # editor template
│   └── configuracoes/page.tsx                # kill-switch + intervalos óleo
├── app/api/whatsapp/
│   ├── webhook/route.ts                      # recebe Evolution
│   └── enviar/route.ts                       # POST interno (chamado pelas server actions)
├── app/api/cron/whatsapp/
│   ├── lembrete-d1/route.ts                  # 18:00 BRT diário
│   ├── cobranca-atraso/route.ts              # 10:00 BRT diário
│   └── lembrete-oleo-km/route.ts             # 11:00 BRT segunda
├── features/whatsapp/
│   ├── actions.ts                            # enviarMensagem (manual), reenviar (falhou), togglePausaEnvios
│   ├── queries.ts                            # listMsgsByCliente, listMsgsRecentes, statusConexao
│   ├── schemas.ts, types.ts
│   ├── templates.ts                          # renderTemplate(tipo, vars)
│   ├── evolution-client.ts                   # wrapper fetch Evolution
│   └── components/
│       ├── status-conexao-card.tsx
│       ├── conversa-thread.tsx
│       ├── template-form.tsx
│       ├── preview-mensagem.tsx              # mostra texto renderizado antes de enviar
│       ├── enviar-rapido-dialog.tsx          # dialog "enviar PIX"/"enviar link ML"
│       └── kill-switch-toggle.tsx
└── shared/lib/
    └── (já tem cron-auth.ts)
```

## Tasks ordenadas

### Infra (manual, Romero faz na VPS — não código)

1. Provisionar VPS Hostgator, instalar Docker + Docker Compose.
2. Apontar `wa.pedrored.com.br` (subdomínio A record) para IP.
3. Subir `docker-compose up -d` com `.env` preenchido.
4. Acessar Evolution (`https://wa.pedrored.com.br`), criar instância `pedrored`, parear chip de Pedro escaneando QR no celular.
5. Gerar `EVOLUTION_API_KEY` na config.
6. Adicionar env vars na Vercel.
7. Validar webhook: enviar mensagem manual no número e verificar log na rota de webhook em produção.

### Schema

8. Migration `20260715000000_init_whatsapp.sql`.
9. `supabase db push`. `pnpm db:gen`.

### Cliente Evolution

10. `evolution-client.ts` — wrapper tipado em torno do fetch:
    - `sendText({ telefone, mensagem })` → POST `/message/sendText/{instance}`
    - `getInstanceStatus()` → GET `/instance/connectionState/{instance}`
    - Headers: `apikey: ${EVOLUTION_API_KEY}`
    - Retry exponencial 3 tentativas em falha de rede

### Template engine

11. `templates.ts`:
    - `renderTemplate(texto, vars)` — substitui `{{placeholder}}` por valor; valida placeholders válidos da lista.
    - `getTemplate(tipo)` — query DB.
    - Helper para gerar `vars` por tipo (ex: `varsParaOSPronta(os)` retorna `{ nome, primeiro_nome, valor, pix_chave }`).

### Action `enviarMensagem`

12. Server action `enviarMensagem({ telefone, conteudo, template_tipo?, clienteId?, osId?, agendamentoId?, pagamentoId? })`:
    - Checa `settings.whatsapp_envios_ativos`. Se `false`, retorna `{ ok: false, reason: 'pausado' }`.
    - Insere registro `whatsapp_msgs` com status `pendente`.
    - Chama `evolution-client.sendText`.
    - Atualiza status para `enviada` + `evolution_msg_id`.
    - Em falha, atualiza status `falhou` + `erro`, retorna `{ ok: false }`.

### Webhook

13. `/api/whatsapp/webhook/route.ts`:
    - POST
    - Valida assinatura HMAC (Evolution suporta header `Authorization: Bearer ...`)
    - Eventos relevantes: `MESSAGES_UPSERT` (recebida) e `SEND_MESSAGE` (status atualizado da enviada)
    - Para recebida: insere `whatsapp_msgs` direcao=in, tenta vincular cliente por telefone normalizado
    - Para atualização: update `whatsapp_msgs.status` baseado em `evolution_msg_id`

### Páginas admin

14. `/app/whatsapp/page.tsx` — status conexão (verde se Evolution responde), métricas (mensagens enviadas hoje/semana, taxa falha), botão "reabrir QR" se desconectou.
15. `/app/whatsapp/conversas` e `/app/whatsapp/conversas/[clienteId]` — histórico read-only.
16. `/app/whatsapp/templates` + editor com preview live (`renderTemplate` com vars mock).
17. `/app/whatsapp/configuracoes` — kill-switch + intervalos óleo + lista jobs cron.

### Cron jobs

18. `/api/cron/whatsapp/lembrete-d1/route.ts`:
    - Auth CRON_SECRET
    - Busca agendamentos `data = current_date + 1` AND `status in ('agendado','confirmado')`
    - Para cada, verifica idempotency em `whatsapp_jobs_cron` (`tipo='lembrete_d1', alvo_id=agendamento_id, marco='d-1'`)
    - Se não existe, monta vars (`primeiro_nome`, `data`, `periodo`) → renderiza template `lembrete_d1` → chama `enviarMensagem` → registra job
19. `/api/cron/whatsapp/cobranca-atraso/route.ts`:
    - Busca parcelas `status='atrasado'`
    - Calcula `dias_atraso = today - data_prevista`
    - Para cada marco {3, 7, 15}: se `dias_atraso = marco` AND não tem job registrado pra esse `(tipo='cobranca_atraso', alvo_id=parcela_id, marco='{N}_dias')`, envia
20. `/api/cron/whatsapp/lembrete-oleo-km/route.ts`:
    - Busca veículos com `km_proxima_troca_oleo not null`
    - Estima km atual: `km_ultima_troca_oleo + (dias_desde_ultima_troca × avg_km_dia_padrao)` (default config simples: 30 km/dia se não tiver dados)
    - Se estimado >= `km_proxima_troca_oleo - antecedencia`, envia (idempotência por `marco = strftime(data, 'YYYY-MM')` evita duplicar no mês)
21. Atualizar `vercel.json` com schedules:
    ```json
    {
      "crons": [
        { "path": "/api/cron/whatsapp/lembrete-d1", "schedule": "0 21 * * *" },
        { "path": "/api/cron/whatsapp/cobranca-atraso", "schedule": "0 13 * * *" },
        { "path": "/api/cron/whatsapp/lembrete-oleo-km", "schedule": "0 14 * * 1" }
      ]
    }
    ```
    (UTC: 21:00 UTC = 18:00 BRT, 13:00 UTC = 10:00 BRT, 14:00 UTC = 11:00 BRT.)

### Disparo OS pronta (não-cron)

22. Em `features/ordens/actions.ts → mudarStatus`, após mudar pra `pronta`, chama `enviarMensagem` com template `os_pronta` (best effort — não bloqueia mudança de status; loga falha mas continua).

### Envio manual

23. Botão "Enviar PIX por WhatsApp" no detalhe OS → `EnviarRapidoDialog` com preview → confirma → `enviarMensagem`.
24. Botão "Enviar link ML" na peça da OS (quando origem = `mercado_livre_afiliado`) → idem.

### Kill-switch

25. `/app/whatsapp/configuracoes` tem toggle. Action `togglePausaEnvios` flipa `settings.whatsapp_envios_ativos`. Crons e `enviarMensagem` checam antes.

### Testes

26. Vitest:
    - `renderTemplate` substitui placeholders e detecta inválido
    - `evolution-client.sendText` mocked com nock-like
27. Playwright (E2E só dos fluxos administrativos):
    - Editar template, ver preview
    - Pausar envios e tentar enviar manual → mostra alert
    - Disparar mudança OS pra "pronta" → entrada em `whatsapp_msgs` aparece

### Documentação

28. `infra/evolution/RUNBOOK.md` — passos pra subir VPS, restart, ver logs (`docker compose logs -f evolution-api`), recuperação de instância caída.
29. Atualizar `data-model.md`, `deploy.md` (Evolution seção), `00-overview.md` → Sprint 5 🟢.

## Critical files

- `supabase/migrations/20260715000000_init_whatsapp.sql`
- `infra/evolution/{docker-compose.yml,Caddyfile,RUNBOOK.md,.env.example}`
- `src/features/whatsapp/**`
- `src/app/api/whatsapp/webhook/route.ts`
- `src/app/api/cron/whatsapp/{lembrete-d1,cobranca-atraso,lembrete-oleo-km}/route.ts`
- `vercel.json`

## Skills

- `superpowers:writing-plans` (recomendado — sprint complexa)
- `superpowers:test-driven-development` (template engine, cron logic)
- `superpowers:systematic-debugging`
- `superpowers:verification-before-completion`

## Verificação

### Automatizada

- [ ] typecheck/lint/test/e2e/build verdes
- [ ] Migration aplica
- [ ] Templates renderizam corretamente em testes unitários
- [ ] Cron routes respondem 401 sem secret, 200 com

### Manual (dev)

- [ ] Evolution conectado, QR pareado, chip Pedro online
- [ ] Webhook recebe mensagem manual (enviar do celular, ver log)
- [ ] Enviar mensagem manual da UI → chega no WhatsApp do tester
- [ ] Toggle kill-switch off → tenta enviar → fica em pendente sem disparar
- [ ] Forçar agendamento amanhã + rodar cron manualmente → lembrete dispara
- [ ] Forçar parcela atrasada 3 dias + rodar cron → cobrança dispara uma vez (não duplica no segundo run)

### Manual (Pedro)

- [ ] Pedro vê status verde da conexão
- [ ] Recebe lembrete D-1 de cliente real
- [ ] OS dele entra em "pronta" → cliente recebe mensagem com PIX
- [ ] Pedro edita um template e vê mudança no próximo envio
- [ ] Confirma "economizando muito tempo" via WhatsApp

## Definition of Done

1. Verificação completa
2. `00-overview.md` Sprint 5 = ✅
3. PR mergeado, deploy verde, VPS estável, crons rodando
4. RUNBOOK validado por Romero conseguindo restart Evolution sem ajuda
5. Pedro validou

## Fora de escopo

- Atendimento automatizado / chatbot resposta (futuro)
- Múltiplas instâncias / multi-número
- Recebimento de imagens/áudio (apenas texto MVP)
- Disparos em massa (broadcast) — risco de banimento WhatsApp
- API oficial WhatsApp Business — caro, exige aprovação Meta
- Verificação Business / catálogo WhatsApp Shopping

## Bloqueios

(adicione — risco principal: WhatsApp banir número se enviar muitas mensagens não solicitadas. Mitigação: opt-in implícito ao cliente entregar telefone à oficina; volume baixo; conteúdo legítimo)

## Progresso

(atualize)

## Referências

- Evolution API docs: https://doc.evolution-api.com
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Caddy auto-HTTPS: https://caddyserver.com/docs/automatic-https
