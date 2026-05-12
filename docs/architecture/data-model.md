# Data Model — Schema vivo Supabase

> **Documento vivo.** Atualize ao fim de cada sprint que mude o schema.
>
> A fonte da verdade é `supabase/migrations/*.sql`. Este arquivo descreve o **estado consolidado** após todas as migrations aplicadas até a sprint corrente.

## Estado atual

**Sprints 0/1/2/3 aplicados em 2026-05-11.** Schema no Supabase remoto (`fcaxivdvhgekomvwbrvr`, region `sa-east-1`).

### Tabelas

- **`vw_modelos`** (24 rows seed) — `id uuid`, `modelo text`, `motor text`, `combustivel text default 'flex'`, `ano_inicio int?`, `ano_fim int?`, `criado_em timestamptz`. `unique(modelo, motor)`. RLS: `vw_modelos_authenticated_all` (authenticated→ALL). Index: `idx_vw_modelos_modelo`.
- **`clientes`** — `id uuid`, `nome text not null`, `telefone text?`, `email text?`, `cpf text?`, `endereco jsonb?` (`{rua, numero, bairro, cidade, cep, complemento}`), `observacoes text?`, `criado_em`, `atualizado_em` (trigger `set_atualizado_em`), `deletado_em timestamptz?` (soft delete). RLS: `clientes_authenticated_all`. Indexes parciais (`where deletado_em is null`): `idx_clientes_nome`, `idx_clientes_telefone`.
- **`veiculos`** — `id uuid`, `cliente_id uuid not null` → `clientes(id) ON DELETE RESTRICT`, `modelo_id uuid?` → `vw_modelos(id) ON DELETE SET NULL`, `modelo_custom text?`, `motor text?`, `ano int?`, `placa text?`, `cor text?`, `km_atual int default 0`, `observacoes text?`, timestamps + soft delete. Constraint check: `modelo_id IS NOT NULL OR modelo_custom IS NOT NULL`. RLS: `veiculos_authenticated_all`. Indexes parciais: `idx_veiculos_cliente`, `idx_veiculos_placa`.
- **`ordens_servico`** — `id uuid`, `numero serial unique`, `cliente_id uuid not null` → `clientes(id) ON DELETE RESTRICT`, `veiculo_id uuid not null` → `veiculos(id) ON DELETE RESTRICT`, `status os_status not null default 'aberta'`, `descricao_problema text not null`, `km_entrada int?`, `km_saida int?`, `total_servicos/total_pecas/total_geral numeric(12,2) default 0` (denormalizados via trigger), `observacoes text?`, timestamps + soft delete, `fechado_em timestamptz?` (preenchido via trigger ao virar `entregue`). RLS: `os_authenticated_all`. Indexes parciais por status, cliente, veiculo, criado_em desc.
- **`os_servicos`** — `id uuid`, `os_id uuid not null` → `ordens_servico(id) ON DELETE CASCADE`, `descricao text`, `valor_unitario numeric(12,2) check >= 0`, `quantidade numeric(8,2) check > 0`, `subtotal numeric(12,2) generated stored = valor_unitario * quantidade`, `ordem int default 0`, `criado_em`. RLS authenticated. Index `idx_os_servicos_os`.
- **`os_pecas`** — `id uuid`, `os_id uuid not null cascade`, `descricao text`, `origem peca_origem default 'fornecedor'`, `custo_unitario / preco_venda_unitario numeric(12,2)`, `quantidade numeric(8,2) > 0`, `subtotal_venda numeric(12,2) generated stored`, `link_ml text?`, `fornecedor_nome text?` (FK estruturada vem na Sprint 2), `item_estoque_id uuid?` → `itens_estoque(id) ON DELETE SET NULL` (Sprint 3), `status peca_status default 'pendente'`, `ordem int`, `criado_em`. RLS authenticated. Indexes `idx_os_pecas_os`, `idx_os_pecas_status`, `idx_os_pecas_item_estoque` (parcial). Trigger `trg_os_pecas_estoque` baixa/estorna estoque quando `origem='estoque'` e `item_estoque_id` está presente (Sprint 3).
- **`os_fotos`** — `id uuid`, `os_id uuid not null cascade`, `storage_path text` (referencia bucket `os-fotos`), `momento foto_momento`, `legenda text?`, `criado_em`. RLS authenticated. Index `idx_os_fotos_os`.
- **`fornecedores`** — `id uuid`, `nome text not null`, `telefone/email/cnpj/endereco/observacoes text?`, timestamps + soft delete. RLS authenticated. Index parcial `idx_fornecedores_nome` (where deletado_em null).
- **`pedidos_fornecedor`** — `id uuid`, `numero serial unique`, `fornecedor_id uuid not null` → `fornecedores(id) ON DELETE RESTRICT`, `os_id uuid?` → `ordens_servico(id) ON DELETE SET NULL`, `status pedido_fornecedor_status default 'cotacao'`, `valor_total numeric(12,2) default 0` (denormalizado via trigger), `data_compra/data_recebimento date?`, `observacoes text?`, timestamps. RLS authenticated. Indexes em status, os, fornecedor.
- **`pedido_fornecedor_itens`** — `id uuid`, `pedido_id uuid not null cascade`, `descricao text not null`, `custo_unitario numeric(12,2) check >= 0`, `quantidade numeric(8,2) > 0`, `subtotal numeric(12,2) generated stored = custo_unitario * quantidade`, `os_peca_id uuid?` → `os_pecas(id) ON DELETE SET NULL`, `item_estoque_id uuid?` → `itens_estoque(id) ON DELETE SET NULL` (Sprint 3, usado por `lancarPedidoNoEstoque`), `criado_em`. RLS authenticated. Trigger recalcula `pedidos_fornecedor.valor_total` em insert/update/delete. Index parcial `idx_pedido_itens_item_estoque`.
- **`pagamentos`** — `id uuid`, `os_id uuid not null` → `ordens_servico(id) ON DELETE RESTRICT`, `ordem int default 1`, `valor numeric(12,2) > 0`, `metodo pagamento_metodo not null`, `status pagamento_status default 'pendente'`, `data_prevista date?`, `data_paga timestamptz?`, `observacoes text?`, timestamps. RLS authenticated. Indexes em os, status, data_prevista (parcial onde status=pendente). Trigger `trg_pagamentos_marca_data_paga` preenche/zera `data_paga` quando status entra/sai de 'pago'.
- **`links_afiliado_enviados`** — `id uuid`, `cliente_id uuid not null` → `clientes(id) ON DELETE RESTRICT`, `os_id uuid?` → `ordens_servico(id) ON DELETE SET NULL`, `link text not null`, `descricao_peca text not null`, `preco_estimado/comissao_estimada/comissao_recebida numeric(12,2)?`, `status link_afiliado_status default 'enviado'`, `data_envio timestamptz default now()`, `data_compra/data_comissao timestamptz?`, `observacoes text?`. RLS authenticated. Indexes em cliente, status, os.
- **`categorias_estoque`** (8 rows seed Sprint 3) — `id uuid`, `nome text not null unique`, `ordem int default 0`, `criado_em`. RLS `categorias_authenticated_all`. Seed: Óleo, Filtro, Pneu, Roda, Fluido, Lâmpada, Palheta, Outro.
- **`itens_estoque`** — `id uuid`, `categoria_id uuid not null` → `categorias_estoque(id) ON DELETE RESTRICT`, `descricao text not null`, `sku text?`, `unidade text default 'un'`, `quantidade_atual numeric(12,3) default 0` (atualizada via RPC `aplicar_movimentacao_estoque`), `custo_medio numeric(12,2) default 0` (médio ponderado, recalculado nas entradas), `preco_venda numeric(12,2) default 0`, `alerta_minimo numeric(12,3) default 0`, `ativo bool default true`, `observacoes text?`, timestamps + soft delete. RLS `itens_authenticated_all`. Indexes parciais: `idx_itens_categoria`, `idx_itens_descricao`, `idx_itens_sku`. Trigger `trg_itens_estoque_atualizado_em`.
- **`movimentacoes_estoque`** — `id uuid`, `item_id uuid not null` → `itens_estoque(id) ON DELETE RESTRICT`, `tipo movimentacao_tipo`, `quantidade numeric(12,3) > 0`, `custo_unitario numeric(12,2)?`, `os_id/os_peca_id/pedido_loja_id/pedido_fornecedor_id` FKs opcionais (`pedido_loja_id` ganha FK na Sprint 6), `ajuste_motivo text?`, `saldo_apos numeric(12,3)` (snapshot), `criado_em`. RLS `movimentacoes_authenticated_all`. Indexes em item, tipo, criado_em, os, pedido_fornecedor (parciais).

### Enums (Sprint 1)

- `os_status` — `aberta | em_andamento | aguardando_peca | pronta | entregue | cancelada`
- `peca_origem` — `estoque | fornecedor | mercado_livre_afiliado` (`estoque` ainda não conecta — Sprint 3)
- `peca_status` — `pendente | comprada | recebida | aplicada`
- `foto_momento` — `entrada | saida | durante`

### Enums (Sprint 2)

- `pagamento_metodo` — `pix | dinheiro | cartao | transferencia` (cartão preparado mas sem fluxo no MVP)
- `pagamento_status` — `pendente | pago | atrasado | cancelado`
- `pedido_fornecedor_status` — `cotacao | comprado | recebido | cancelado`
- `link_afiliado_status` — `enviado | cliente_comprou | comissao_recebida | cancelado`

### Enums (Sprint 3)

- `movimentacao_tipo` — `entrada | saida_os | saida_loja | ajuste`

### Funções / triggers (Sprint 1)

- `recalcula_totais_os(p_os_id uuid)` — recalcula `total_servicos`, `total_pecas`, `total_geral` da OS via `sum(subtotal)` e `sum(subtotal_venda)` dos filhos.
- `trg_recalcula_totais_os()` — trigger after insert/update/delete em `os_servicos` e `os_pecas` que chama `recalcula_totais_os` com o `os_id` afetado.
- `trg_os_marca_fechado_em()` — before update em `ordens_servico` que seta `fechado_em = now()` ao virar `entregue` e zera quando muda pra outro status.

### Funções / triggers (Sprint 2)

- `recalcula_total_pedido_fornecedor(p_pedido_id uuid)` — atualiza `pedidos_fornecedor.valor_total` somando `subtotal` dos itens.
- `trg_pedido_itens_recalc()` — trigger after insert/update/delete em `pedido_fornecedor_itens` chamando a função acima.
- `trg_pagamentos_marca_data_paga()` — trigger before insert/update em `pagamentos`: quando status entra em `pago` seta `data_paga = now()` (se não veio explícito); quando sai de `pago`, zera `data_paga`.
- `marca_pagamentos_atrasados()` returns int — chamada diária pelo Vercel Cron `/api/cron/financeiro/marca-atrasados`; move `pagamentos` com `status='pendente' AND data_prevista < current_date` para `'atrasado'`.

### Views (Sprint 2)

- `view_contas_a_receber` — agrega por cliente (join `clientes → ordens_servico → pagamentos`): `parcelas_em_aberto`, `parcelas_atrasadas`, `total_em_aberto`, `total_atrasado`, `proxima_data`. `HAVING parcelas_em_aberto > 0`.
- `view_capital_investido` — pedidos com `status in ('comprado','recebido')` cujo cliente ainda não pagou tudo (ou que não têm OS — compra estoque puro): traz `valor_total`, `fornecedor_nome`, `os_total`, `cliente_pagou`.

### Funções / triggers (Sprint 3)

- `aplicar_movimentacao_estoque(p_item_id, p_tipo, p_quantidade, p_custo_unitario?, p_os_id?, p_os_peca_id?, p_pedido_loja_id?, p_pedido_fornecedor_id?, p_ajuste_motivo?) returns uuid` — locks `itens_estoque` row, valida saldo (saída) ou exige `custo_unitario` (entrada) / `ajuste_motivo` (ajuste), recalcula `custo_medio` ponderado em entradas, atualiza `quantidade_atual`, insere movimentação com `saldo_apos`.
- `trg_os_pecas_baixa_estoque()` + trigger `trg_os_pecas_estoque` (after insert/update/delete em `os_pecas`): baixa via `aplicar_movimentacao_estoque saida_os` em INSERT, estorna+rebaixa em UPDATE, estorna em DELETE. Só age quando `origem='estoque'` e `item_estoque_id` presente.

### Views (Sprint 3)

- `view_itens_abaixo_minimo` — `select * from itens_estoque where deletado_em is null and ativo=true and quantidade_atual <= alerta_minimo`. Usada pelo card do dashboard.

### Storage

- Bucket `os-fotos` (privado), criado via migration. Policies em `storage.objects`: `os_fotos_select_auth`, `os_fotos_insert_auth`, `os_fotos_delete_auth` — todos restritos a `authenticated` no bucket `os-fotos`. Caminhos salvos como `${osId}/${nanoid()}.${ext}`. URLs servidas via `createSignedUrl` (TTL 1h).

### Função compartilhada

- `set_atualizado_em()` — trigger plpgsql reutilizado por toda tabela com coluna `atualizado_em`.

### Tipos TS

Gerados em `src/lib/supabase/database.types.ts` via `pnpm db:gen` (Postgrest v14.5). Importar:
```ts
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
type Cliente = Tables<"clientes">;
```

## ERD esperado (referência futura)

Diagrama lógico do sistema completo, organizado por feature. Cada sprint materializa um pedaço.

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  clientes   │1───*│  veiculos   │1───*│ ordens_servico   │
└─────────────┘     └─────────────┘     └──────────┬───────┘
                                                    │
                          ┌─────────────────────────┼─────────────────────┐
                          │                         │                     │
                          ▼                         ▼                     ▼
                  ┌──────────────┐         ┌──────────────┐       ┌──────────────┐
                  │ os_servicos  │         │  os_pecas    │       │  os_fotos    │
                  └──────────────┘         └──────┬───────┘       └──────────────┘
                                                  │
                                  ┌───────────────┼──────────────┐
                                  │               │              │
                                  ▼               ▼              ▼
                          ┌──────────────┐ ┌──────────┐ ┌─────────────────┐
                          │   estoque    │ │ pedidos_ │ │ links_afiliado  │
                          │              │ │fornecedor│ │   _enviados     │
                          └──────┬───────┘ └────┬─────┘ └─────────────────┘
                                 │              │
                                 ▼              ▼
                          ┌──────────────┐ ┌─────────────┐
                          │ movimentacoes│ │ fornecedores│
                          │   _estoque   │ └─────────────┘
                          └──────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   pagamentos     │    │     agenda       │    │ whatsapp_msgs    │
│  (parcelas OS)   │    │ (slots manhã/PM) │    │  (in/out + log)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│ produtos_loja    │    │ pedidos_loja     │
│ (vitrine pública)│1──*│  + itens_pedido  │
└──────────────────┘    └──────────────────┘
```

## Convenções gerais

- **Naming:** snake_case para tabelas e colunas (Postgres-friendly e match com Supabase).
- **PK:** `id uuid primary key default gen_random_uuid()` em toda tabela.
- **Timestamps:** `criado_em timestamptz not null default now()`, `atualizado_em timestamptz not null default now()` quando relevante. Trigger genérico atualiza `atualizado_em` em update.
- **Soft delete:** `deletado_em timestamptz null`. Queries default filtram `WHERE deletado_em IS NULL`. Nunca DELETE físico exceto em `whatsapp_msgs` antigas (>1 ano) via job.
- **Money:** `numeric(12, 2)` para tudo que é dinheiro. Nunca float/double.
- **Enums:** criados com `CREATE TYPE ... AS ENUM (...)` em uma migration dedicada antes da tabela que usa.
- **RLS:** habilitado em toda tabela. No MVP single-user, policy `auth.role() = 'authenticated'` permite tudo. Loja pública usa `service_role` em server actions específicas.
- **FK:** sempre `ON DELETE RESTRICT` por default. Exceções documentadas inline na migration.
- **Índices:** criar para todo FK + colunas de filtro frequente (status, datas).

## Mapa por sprint (sumário do que cada uma adiciona)

### Sprint 0 — Setup

Tabelas:
- `vw_modelos` — catálogo seed VW (modelo, motor, tipo combustível, ano início/fim)
- `clientes` — nome, telefone, email, cpf, endereço, observações
- `veiculos` — cliente_id (FK), modelo_id (FK opcional pra `vw_modelos`), modelo_custom (text opcional), motor, ano, placa, cor, km_atual

Detalhes completos: `docs/sprints/sprint-00-setup.md`.

### Sprint 1 — Core OS

Enums:
- `os_status` — `aberta | em_andamento | aguardando_peca | pronta | entregue | cancelada`
- `peca_origem` — `estoque | fornecedor | mercado_livre_afiliado` (estoque ainda não conecta no Sprint 1, fica preparado)
- `peca_status` — `pendente | comprada | recebida | aplicada`
- `foto_momento` — `entrada | saida | durante`

Tabelas:
- `ordens_servico` — cliente_id, veiculo_id, status, descricao_problema, km_entrada, km_saida, total_servicos, total_pecas, total_geral, observacoes, criado_em, fechado_em
- `os_servicos` — os_id, descricao, valor_unitario, quantidade, subtotal
- `os_pecas` — os_id, descricao, origem, custo_unitario, preco_venda_unitario, quantidade, subtotal_venda, link_ml, fornecedor_nome, status
- `os_fotos` — os_id, url, momento, legenda

Detalhes completos: `docs/sprints/sprint-01-core-os.md`.

### Sprint 2 — Financeiro

Enums:
- `pagamento_metodo` — `pix | dinheiro | cartao` (cartão preparado)
- `pagamento_status` — `pendente | pago | atrasado | cancelado`
- `pedido_fornecedor_status` — `cotacao | comprado | recebido | cancelado`

Tabelas:
- `fornecedores` — nome, telefone, observacoes
- `pedidos_fornecedor` — fornecedor_id, os_id (FK opcional), valor_pago, data_compra, observacoes, status
- `pedido_fornecedor_itens` — pedido_id, descricao, custo_unitario, quantidade
- `pagamentos` — os_id, valor, metodo, status, data_prevista, data_paga, observacoes (parcelas; OS pode ter N pagamentos)
- `links_afiliado_enviados` — cliente_id, os_id (FK opcional), link, descricao_peca, comissao_estimada, status (enviado/comprado/comissao_recebida), data_envio, data_compra_estimada

Views/funções:
- `view_contas_a_receber` — agregada por cliente com soma de pagamentos pendentes/atrasados
- Função `marca_atrasados()` chamada por cron diário (via Vercel Cron) que move `pendente` → `atrasado` quando passa data prevista

### Sprint 3 — Estoque

Enums:
- `movimentacao_tipo` — `entrada | saida_os | saida_loja | ajuste`

Tabelas:
- `categorias_estoque` — nome (oleo, filtro, pneu, roda, fluido, outro)
- `itens_estoque` — categoria_id, descricao, sku (opcional), unidade (un, l, kg), quantidade_atual, custo_medio, preco_venda, alerta_minimo, ativo
- `movimentacoes_estoque` — item_id, tipo, quantidade, custo_unitario, os_id (FK opcional), pedido_loja_id (FK opcional), pedido_fornecedor_id (FK opcional), observacoes, criado_em

Mudanças:
- `os_pecas` ganha FK opcional `item_estoque_id`. Quando `origem = 'estoque'`, vincula. Trigger ou server action gera movimentação `saida_os` automaticamente.

### Sprint 4 — Agenda

Enums:
- `agenda_periodo` — `manha | tarde`
- `agenda_status` — `agendado | confirmado | em_andamento | concluido | cancelado | nao_compareceu`

Tabelas:
- `agendamentos` — cliente_id, veiculo_id (opcional), os_id (FK opcional, criada quando carro entra), data, periodo, descricao_servico, status, observacoes
- `config_capacidade` — data, periodo, capacidade_max (default 3 carros por período, configurável)

### Sprint 5 — WhatsApp

Enums:
- `whatsapp_msg_direcao` — `in | out`
- `whatsapp_msg_status` — `enviada | entregue | lida | falhou`
- `whatsapp_template_tipo` — `lembrete_d1 | os_pronta | cobranca_atraso | lembrete_oleo_km | manual`

Tabelas:
- `whatsapp_msgs` — cliente_id, telefone, direcao, conteudo, template_tipo, status, evolution_msg_id, payload_raw jsonb, criado_em
- `whatsapp_templates` — tipo, template_texto (com placeholders {{nome}}, {{data}}, {{valor}}, {{pix}}), ativo, atualizado_em
- `whatsapp_jobs_cron` — log de execução dos jobs automáticos (qual cliente, qual ação, sucesso/falha)

### Sprint 6 — PedroRed Store (loja pública)

Enums:
- `produto_status` — `ativo | inativo | esgotado`
- `pedido_loja_status` — `aguardando_pagamento | pago | em_separacao | enviado | retirado | cancelado`

Tabelas:
- `produtos_loja` — item_estoque_id (FK opcional, herda preço/estoque), titulo, slug, descricao, fotos jsonb (array urls Storage), preco, frete_info text, status, destaque bool, criado_em
- `pedidos_loja` — cliente_nome, cliente_telefone, cliente_endereco jsonb (rua, num, bairro, cidade, cep, complemento), valor_total, metodo_pagamento, comprovante_url (upload do PIX), status, observacoes, criado_em
- `itens_pedido_loja` — pedido_id, produto_id, quantidade, preco_unitario, subtotal

Notas:
- `produtos_loja` espelha `itens_estoque` quando vinculado, mas pode ter produtos exclusivos da loja (ex: peças via afiliado ML que Pedro só lista).

### Sprint 7 — IA + Dashboards

Tabelas:
- `analytics_chat_sessoes` — id, titulo, criado_em
- `analytics_chat_msgs` — sessao_id, role (`user | assistant`), conteudo, criado_em

Views materializadas (atualizadas via cron):
- `mv_faturamento_diario`
- `mv_faturamento_mensal`
- `mv_ranking_pecas` (peças mais vendidas + margem)
- `mv_ranking_servicos`
- `mv_clientes_top` (por receita)
- `mv_alertas_clientes` (sem visita há >X meses, troca de óleo vencendo, parcelas atrasadas)

## Política RLS

```sql
-- Padrão para tabelas do admin (single-user)
alter table {nome} enable row level security;
create policy "admin_all" on {nome}
  for all
  to authenticated
  using (true)
  with check (true);
```

Para tabelas da loja pública (`produtos_loja`, `pedidos_loja`, `itens_pedido_loja`):
```sql
-- SELECT público em produtos ativos
create policy "loja_select_publico" on produtos_loja
  for select
  to anon, authenticated
  using (status = 'ativo');

-- INSERT pedido feito via server action com service_role (não anon direto)
-- Por isso não criamos policy anon insert — tudo passa pelo backend
```

## Migrations: convenção de nomes

```
supabase/migrations/
├── 20260510000000_init_clientes_veiculos.sql        # Sprint 0
├── 20260510000001_seed_vw_modelos.sql               # Sprint 0
├── 20260520000000_init_ordens_servico.sql           # Sprint 1
├── 20260601000000_init_financeiro.sql               # Sprint 2
├── ...
```

Timestamp + verbo + descrição. Uma migration nunca é editada após push pra produção — sempre nova migration corrigindo.
