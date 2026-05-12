alter table ordens_servico
  add column agendamento_id uuid references agendamentos(id) on delete set null;

create index idx_ordens_servico_agendamento on ordens_servico(agendamento_id);
