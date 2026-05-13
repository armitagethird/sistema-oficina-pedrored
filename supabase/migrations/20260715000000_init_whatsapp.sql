-- Sprint 5 — WhatsApp via Evolution API

-- Enums
create type whatsapp_direcao as enum ('in', 'out');

create type whatsapp_msg_status as enum (
  'pendente',
  'enviada',
  'entregue',
  'lida',
  'falhou'
);

create type whatsapp_template_tipo as enum (
  'lembrete_d1',
  'os_pronta',
  'cobranca_atraso_3',
  'cobranca_atraso_7',
  'cobranca_atraso_15',
  'lembrete_oleo_km',
  'manual'
);

create type whatsapp_job_tipo as enum (
  'lembrete_d1',
  'cobranca_atraso',
  'lembrete_oleo_km'
);

-- Templates editáveis
create table whatsapp_templates (
  tipo            whatsapp_template_tipo primary key,
  template_texto  text not null,
  ativo           boolean not null default true,
  descricao       text,
  atualizado_em   timestamptz not null default now()
);

insert into whatsapp_templates (tipo, template_texto, descricao) values
  ('lembrete_d1',
   'Olá {{primeiro_nome}}! Lembrete do seu agendamento na PedroRed amanhã ({{data}}, {{periodo}}). Confirma?',
   'Mensagem enviada 1 dia antes do agendamento'),
  ('os_pronta',
   'Olá {{primeiro_nome}}, seu carro está pronto pra retirar! Valor total: {{valor}}. Chave PIX: {{pix_chave}}',
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
  ('manual',
   '{{texto}}',
   'Mensagem manual livre — placeholder único {{texto}}');

create trigger trg_whatsapp_templates_atualizado_em
  before update on whatsapp_templates
  for each row execute function set_atualizado_em();

-- Mensagens enviadas/recebidas (log completo)
create table whatsapp_msgs (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references clientes(id) on delete set null,
  telefone        text not null,
  direcao         whatsapp_direcao not null,
  template_tipo   whatsapp_template_tipo,
  conteudo        text not null,
  status          whatsapp_msg_status not null default 'pendente',
  evolution_msg_id text,
  os_id           uuid references ordens_servico(id) on delete set null,
  agendamento_id  uuid references agendamentos(id) on delete set null,
  pagamento_id    uuid references pagamentos(id) on delete set null,
  payload_raw     jsonb,
  erro            text,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index idx_wa_msgs_cliente on whatsapp_msgs(cliente_id) where cliente_id is not null;
create index idx_wa_msgs_telefone on whatsapp_msgs(telefone);
create index idx_wa_msgs_direcao on whatsapp_msgs(direcao);
create index idx_wa_msgs_criado on whatsapp_msgs(criado_em desc);
create index idx_wa_msgs_evolution on whatsapp_msgs(evolution_msg_id)
  where evolution_msg_id is not null;

create trigger trg_whatsapp_msgs_atualizado_em
  before update on whatsapp_msgs
  for each row execute function set_atualizado_em();

-- Log execução de jobs (idempotency)
create table whatsapp_jobs_cron (
  id          uuid primary key default gen_random_uuid(),
  tipo        whatsapp_job_tipo not null,
  alvo_id     uuid not null,
  marco       text not null,
  msg_id      uuid references whatsapp_msgs(id) on delete set null,
  sucesso     boolean not null,
  erro        text,
  criado_em   timestamptz not null default now(),
  unique (tipo, alvo_id, marco)
);

create index idx_wa_jobs_tipo on whatsapp_jobs_cron(tipo);
create index idx_wa_jobs_criado on whatsapp_jobs_cron(criado_em desc);

-- Settings (chave/valor text — tabela criada na Sprint 4)
insert into settings (chave, valor, descricao) values
  ('whatsapp_envios_ativos', 'true',
   'Kill-switch global. Quando "false", envios automáticos e manuais ficam bloqueados.'),
  ('whatsapp_oleo_km_intervalo', '10000',
   'Km estimado entre trocas de óleo (default 10000).'),
  ('whatsapp_oleo_km_antecedencia', '500',
   'Quando faltar X km para próxima troca, enviar lembrete (default 500).'),
  ('whatsapp_oleo_km_dia', '30',
   'Km/dia médio para estimar quilometragem atual entre OS.');

-- Campos novos em veiculos para lembrete de óleo
alter table veiculos
  add column km_ultima_troca_oleo   integer,
  add column data_ultima_troca_oleo date,
  add column km_proxima_troca_oleo  integer;

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
