# Data Model — Schema vivo Supabase

> **Documento vivo.** Atualize ao fim de cada sprint que mude o schema.
>
> A fonte da verdade é `supabase/migrations/*.sql`. Este arquivo descreve o **estado consolidado** após todas as migrations aplicadas até a sprint corrente.

## Estado atual

**Sprint corrente: 0** — schema ainda não criado. Esta seção será preenchida ao fim do Sprint 0.

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
