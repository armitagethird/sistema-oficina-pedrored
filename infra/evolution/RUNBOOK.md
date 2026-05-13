# Evolution API — Runbook (VPS Hostgator)

> Todos os comandos abaixo rodam **na VPS** via SSH, dentro de
> `~/evolution/` (ou onde você colocou esta cópia do diretório
> `infra/evolution/` deste repositório).

## Pré-requisitos

1. VPS Hostgator com Docker + Docker Compose v2 instalados:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   newgrp docker
   ```
2. Subdomínio `wa.pedrored.com.br` apontando para o IP da VPS via registro **A**.
3. Portas **80** e **443** liberadas no firewall (Caddy precisa para emitir
   certificado Let's Encrypt automático).
4. Chip dedicado do WhatsApp (recomendado: número novo, R$10 chip pré-pago) —
   Evolution toma controle exclusivo do número.

## Subir do zero

```bash
# 1. Copie a pasta infra/evolution do repo para a VPS
scp -r infra/evolution user@vps:~/evolution

# 2. Na VPS
cd ~/evolution
cp .env.example .env
# Edite .env e preencha:
#   - EVOLUTION_API_KEY (openssl rand -hex 32)
#   - POSTGRES_PASSWORD
#   - WEBHOOK_GLOBAL_URL=https://sistema-oficina-pedrored.vercel.app/api/whatsapp/webhook
nano .env

# 3. Sobe os containers
docker compose up -d

# 4. Aguarde Caddy emitir certificado (1-2 min na primeira vez)
docker compose logs -f caddy
```

## Parear o WhatsApp

1. Acesse `https://wa.pedrored.com.br/manager` no navegador.
2. Faça login com `EVOLUTION_API_KEY`.
3. Crie uma instância com `instanceName = pedrored` (mesmo nome configurado
   em Vercel via `EVOLUTION_INSTANCE_NAME`).
4. Clique em **Conectar** → mostra QR Code.
5. No celular do Pedro com o chip dedicado: WhatsApp → ⋮ → Aparelhos
   conectados → Conectar um aparelho → escaneia QR.
6. Aguarde estado mudar para **open** (conectado).

## Validar webhook

No Vercel, em `/app/whatsapp`, o card de status deve ficar verde. Envie uma
mensagem do seu WhatsApp pessoal para o chip do Pedro — em poucos segundos
deve aparecer em `/app/whatsapp/conversas`.

Se não aparecer:
- Confirme que `WEBHOOK_GLOBAL_URL` aponta para o domínio em produção (HTTPS).
- Veja logs da Evolution:
  ```bash
  docker compose logs -f evolution-api | grep -i webhook
  ```

## Operações comuns

| Ação | Comando |
|---|---|
| Ver logs todos | `docker compose logs -f` |
| Ver logs só da API | `docker compose logs -f evolution-api` |
| Restart só Evolution | `docker compose restart evolution-api` |
| Restart tudo | `docker compose restart` |
| Parar tudo | `docker compose down` |
| Subir tudo (mantém volumes) | `docker compose up -d` |
| Atualizar imagem | `docker compose pull evolution-api && docker compose up -d evolution-api` |
| Status dos containers | `docker compose ps` |

## Backup

Dois volumes importantes:
- `evo-pgdata` — banco interno da Evolution (estados, sessões).
- `caddy-data` — certificados Let's Encrypt.

Backup rápido para `~/backup-evo-$(date +%F).tar.gz`:
```bash
sudo tar -czf ~/backup-evo-$(date +%F).tar.gz \
  /var/lib/docker/volumes/evolution_evo-pgdata \
  /var/lib/docker/volumes/evolution_caddy-data
```

## Recuperar instância caída

1. `docker compose logs evolution-api | tail -50` — identificar erro.
2. Erros mais comuns:
   - **"Cannot connect to postgres"** → restart postgres antes: `docker compose restart postgres && sleep 5 && docker compose restart evolution-api`.
   - **Sessão WhatsApp expirada** → no manager, deletar a instância `pedrored` e parear novamente o QR (Pedro precisa estar com o celular à mão).
   - **Certificado SSL ausente** → conferir DNS apontando, depois `docker compose restart caddy`.
3. Se nenhuma funcionar:
   ```bash
   docker compose down
   docker compose up -d
   ```
4. Em último caso (perde sessão WhatsApp — precisa reparear):
   ```bash
   docker compose down -v   # remove volumes!
   docker compose up -d
   ```

## Kill-switch global (no admin)

Se a Evolution começar a enviar mensagens indesejadas (bug, número errado, etc),
desligue **antes** de mexer na VPS:

1. Acessar https://sistema-oficina-pedrored.vercel.app/app/whatsapp/configuracoes
2. Desligar o toggle "Envios automáticos".

Isso bloqueia crons e envios manuais imediatamente — Evolution continua
recebendo (não bloqueia inbound), mas não emite nada novo.

## Custos

- VPS Hostgator (plano Iron ou similar): R$ 50-100/mês.
- Chip pré-pago: R$ 10 inicial + créditos mínimos.
- Domínio `pedrored.com.br`: ~R$ 40/ano.
- SSL Let's Encrypt: grátis (auto-renovação via Caddy).
