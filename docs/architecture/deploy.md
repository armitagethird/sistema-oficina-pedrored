# Deploy — Topologia e Operação

## Componentes

| Componente | Onde roda | Quando entra | Responsabilidade |
|-----------|-----------|--------------|------------------|
| Next.js app (admin + loja) | Vercel | Sprint 0 | UI, API routes, server actions, jobs cron |
| Supabase Postgres + Auth + Storage | Supabase Cloud (free tier) | Sprint 0 | Banco, autenticação, fotos OS, comprovantes loja |
| Evolution API | VPS Hostgator (Docker) | Sprint 5 | Bridge WhatsApp (envio + recebimento via webhooks) |

## Vercel — Next.js app

### Setup inicial (Sprint 0)

1. Criar projeto Vercel conectando ao repositório GitHub.
2. **Framework Preset:** Next.js (auto-detectado).
3. **Build Command:** `pnpm build` (Vercel detecta `pnpm-lock.yaml` automaticamente).
4. **Install Command:** `pnpm install`.
5. **Output Directory:** `.next` (default).
6. **Node version:** 20.x.

### Variáveis de ambiente (production + preview)

Cole no painel Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sprint 2+
CRON_SECRET=<gerar com: openssl rand -hex 32>

# Sprint 5+
EVOLUTION_API_URL=https://wa.pedrored.com.br
EVOLUTION_API_KEY=xxx
EVOLUTION_INSTANCE_NAME=pedrored
WHATSAPP_WEBHOOK_SECRET=xxx   # opcional, valida header `apikey` no webhook /api/whatsapp/webhook

# Sprint 6+
PIX_CHAVE=xxx
PIX_NOME_BENEFICIARIO=Pedro Silva
PIX_CIDADE=Cidade

# Sprint 7+
GEMINI_API_KEY=xxx
ANALYTICS_PROVIDER=gemini
```

### Domínios

| Sprint | Domínio | Aponta para |
|--------|---------|-------------|
| 0 | `pedrored.vercel.app` | Vercel default. Loja (route group `(public)`) responde no `/`, admin em `/login` + `/app`. |
| 6 | `pedrored.com.br` | Vercel custom domain. Mesma app, raiz pública. |
| 6 | `app.pedrored.com.br` (opcional) | Subdomínio do admin via `next.config.ts` rewrites se quisermos URL bonita. |

### Cron jobs (Vercel Cron)

**Atenção:** Vercel cron schedules são sempre em UTC. Para 09:00 BRT (UTC-3, sem horário de verão desde 2019) use `0 12 * * *`. Cada job futuro repete o cálculo.

Estado atual de `vercel.json` (após Sprint 5):

```json
{
  "crons": [
    { "path": "/api/cron/financeiro/marca-atrasados", "schedule": "0 12 * * *" },
    { "path": "/api/cron/whatsapp/lembrete-d1",       "schedule": "0 21 * * *" },
    { "path": "/api/cron/whatsapp/cobranca-atraso",   "schedule": "0 13 * * *" },
    { "path": "/api/cron/whatsapp/lembrete-oleo-km",  "schedule": "0 14 * * 1" }
  ]
}
```

Mapeamento UTC → BRT:
- `0 12 * * *` → 09:00 BRT diário (marca atrasos)
- `0 21 * * *` → 18:00 BRT diário (lembrete D-1)
- `0 13 * * *` → 10:00 BRT diário (cobrança atraso)
- `0 14 * * 1` → 11:00 BRT segunda (lembrete óleo)

Crons futuros (Sprint 7):
```json
{ "path": "/api/cron/analytics/refresh-mvs", "schedule": "0 6 * * *" }
```

Jobs cron em `src/app/api/cron/*/route.ts`. Cada rota chama `assertCronAuth(req)` em `src/shared/lib/cron-auth.ts`, que exige `Authorization: Bearer ${CRON_SECRET}` — Vercel injeta o header automaticamente quando dispara o cron e o env var `CRON_SECRET` existe.

Rotas cron usam `createServiceRoleClient()` em vez do client padrão por não terem cookie de sessão; isso bypassa RLS, então valide a autorização **antes** de tocar qualquer dado.

## Supabase

### Setup inicial (Sprint 0)

1. Criar projeto em supabase.com (free tier — 500MB storage, 2GB transfer/mês, suficiente pra MVP).
2. **Region:** `sa-east-1` (São Paulo) — menor latência do Pedro.
3. Anotar `URL`, `anon key`, `service_role key` → variáveis Vercel.
4. Aplicar migrations via CLI local:
   ```bash
   supabase link --project-ref xxx
   supabase db push
   ```
5. Habilitar Storage bucket privado `os-fotos` (Sprint 1) e `loja-comprovantes` (Sprint 6).
6. Configurar Auth → Email — desabilitar signups públicos (apenas Pedro). Criar conta dele manual via dashboard.

### Backups

Free tier Supabase = backup diário automático mantido por 7 dias. Para período maior, configurar export manual semanal via `supabase db dump > backups/YYYY-MM-DD.sql` (script futuro).

## VPS Hostgator — Evolution API (Sprint 5)

### Pré-requisitos

- VPS Linux (Ubuntu 22.04 sugerido) com Docker + Docker Compose v2 instalados.
- Subdomínio `wa.pedrored.com.br` apontando (registro A) para o IP da VPS.
- Portas 80/443 liberadas (Caddy emite certificado Let's Encrypt automático).
- Chip WhatsApp dedicado (número exclusivo da oficina; Evolution toma controle).

### Stack docker-compose

Arquivos em `infra/evolution/`:
- `docker-compose.yml` — 4 serviços (`evolution-api`, `postgres`, `redis`, `caddy`).
- `caddy/Caddyfile` — reverse proxy + HTTPS automático para `wa.pedrored.com.br`.
- `.env.example` — variáveis necessárias (`EVOLUTION_API_KEY`, `POSTGRES_PASSWORD`,
  `WEBHOOK_GLOBAL_URL`).
- `RUNBOOK.md` — passo-a-passo de bootstrap, pareamento, restart, recuperação.

### Webhook → Vercel

Evolution chama:
```
POST https://sistema-oficina-pedrored.vercel.app/api/whatsapp/webhook
```

A rota:
1. Valida header `apikey` ou `Authorization: Bearer ...` quando
   `WHATSAPP_WEBHOOK_SECRET` está setado (recomendado em produção).
2. Trata `MESSAGES_UPSERT` (insere `whatsapp_msgs` direcao=in vinculando cliente
   por telefone) e `MESSAGES_UPDATE`/`SEND_MESSAGE` (atualiza status via mapa
   PENDING/SERVER_ACK/DELIVERY_ACK/READ/ERROR → `whatsapp_msg_status`).

### Kill-switch global

`/app/whatsapp/configuracoes` controla o toggle `whatsapp_envios_ativos` na
tabela `settings`. Quando off, todos os crons e envios manuais ficam bloqueados
(o webhook continua aceitando inbound). Útil em incidentes.

### Custos VPS

- Hostgator VPS L1: ~R$60/mês.
- Apenas Evolution + auxiliares. Sem Next.js (continua na Vercel).

## Observabilidade (mínima no MVP)

- **Vercel Analytics** — habilitar (free tier).
- **Supabase Logs** — dashboard nativo.
- **Sentry** — adicionar opcionalmente no Sprint 7 se houver bugs em produção. Não no MVP.

## Disaster recovery

Cenários previstos:

| Cenário | Recuperação |
|---------|-------------|
| Vercel cai | Aceitar downtime (free tier). Migrar pra Cloudflare Pages se virar problema recorrente. |
| Supabase cai | Aceitar downtime. Backup diário disponível para restore se houver corrupção. |
| VPS Hostgator cai (Sprint 5+) | WhatsApp para de funcionar — admin segue rodando. Reiniciar Docker via SSH (`docker compose restart` na VPS). Runbook completo em `infra/evolution/RUNBOOK.md`. |
| Pedro perde celular | Faz logout via Supabase dashboard, faz reset de senha por email, loga novo dispositivo. |
| Esquecimento de chave PIX no `.env` | Loja mostra "configurando, fale via WhatsApp" e segue funcionando. Não derruba o app. |
