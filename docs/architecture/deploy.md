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

Estado atual de `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/financeiro/marca-atrasados", "schedule": "0 12 * * *" }
  ]
}
```

Crons futuros que vão entrar conforme as sprints (referência, ainda não criados):

```json
{ "path": "/api/cron/whatsapp/lembrete-d1", "schedule": "0 21 * * *" }
{ "path": "/api/cron/whatsapp/cobranca-atraso", "schedule": "0 13 * * *" }
{ "path": "/api/cron/whatsapp/lembrete-oleo-km", "schedule": "0 14 * * 1" }
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

- VPS Linux (Ubuntu 22.04 sugerido) com Docker + Docker Compose instalados.
- Subdomínio apontando para o IP da VPS: `wa.pedrored.com.br`.
- Certificado SSL via Let's Encrypt (Caddy ou nginx + certbot).

### docker-compose.yml

Será criado em `infra/evolution/docker-compose.yml` no Sprint 5. Stack:

- `evolution-api` — bridge WhatsApp (imagem oficial `atendai/evolution-api:latest`).
- `postgres` — banco da Evolution (separado do Supabase — armazena estado de sessões WhatsApp).
- `redis` — cache de mensagens.

### Webhook → Vercel

Configurar Evolution para apontar webhooks de mensagens recebidas para:
```
POST https://pedrored.vercel.app/api/whatsapp/webhook
```

Vercel recebe, valida assinatura (`X-Evolution-Signature` HMAC), processa e responde 200.

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
| VPS Hostgator cai (Sprint 5+) | WhatsApp para de funcionar — admin segue rodando. Reiniciar Docker via SSH. Documentar runbook em `infra/evolution/RUNBOOK.md` quando criar VPS. |
| Pedro perde celular | Faz logout via Supabase dashboard, faz reset de senha por email, loga novo dispositivo. |
| Esquecimento de chave PIX no `.env` | Loja mostra "configurando, fale via WhatsApp" e segue funcionando. Não derruba o app. |
