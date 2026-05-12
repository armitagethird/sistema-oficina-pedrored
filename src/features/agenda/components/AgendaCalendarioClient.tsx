"use client";

import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";

interface Props {
  diasComAgendamento: string[];
  mesBase: string;
}

export function AgendaCalendarioClient({ diasComAgendamento, mesBase }: Props) {
  const selected = diasComAgendamento.map((d) => new Date(d + "T12:00:00"));
  const month = new Date(mesBase + "-01T12:00:00");

  return (
    <Calendar
      mode="multiple"
      selected={selected}
      month={month}
      locale={ptBR}
      className="rounded-md border"
    />
  );
}
