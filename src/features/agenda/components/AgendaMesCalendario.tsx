import Link from "next/link";
import { addMonths, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAgendamentosMes } from "../queries";
import { AgendaCalendarioClient } from "./AgendaCalendarioClient";

interface Props {
  ano: number;
  mes: number;
}

export async function AgendaMesCalendario({ ano, mes }: Props) {
  const agendamentos = await getAgendamentosMes(ano, mes);

  const contagem = new Map<string, number>();
  for (const ag of agendamentos) {
    contagem.set(ag.data, (contagem.get(ag.data) ?? 0) + 1);
  }

  const dataBase = new Date(ano, mes - 1, 1);
  const prevDate = subMonths(dataBase, 1);
  const nextDate = addMonths(dataBase, 1);

  const mesBase = `${ano}-${String(mes).padStart(2, "0")}`;
  const diasComAgendamento = Array.from(contagem.keys());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
          {format(dataBase, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/app/agenda/mes?ano=${prevDate.getFullYear()}&mes=${prevDate.getMonth() + 1}`}
            >
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/app/agenda/mes?ano=${new Date().getFullYear()}&mes=${new Date().getMonth() + 1}`}
            >
              Hoje
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/app/agenda/mes?ano=${nextDate.getFullYear()}&mes=${nextDate.getMonth() + 1}`}
            >
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <AgendaCalendarioClient
        diasComAgendamento={diasComAgendamento}
        mesBase={mesBase}
      />

      <div className="space-y-1">
        <p className="text-sm font-medium">
          Total: {agendamentos.length} agendamento(s)
        </p>
        {Array.from(contagem.entries())
          .sort()
          .map(([data, count]) => (
            <Link
              key={data}
              href={`/app/agenda?data=${data}`}
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <span className="text-muted-foreground">
                {format(new Date(data + "T12:00:00"), "d/MM (EEE)", {
                  locale: ptBR,
                })}
              </span>
              <Badge variant="secondary">{count}</Badge>
            </Link>
          ))}
      </div>
    </div>
  );
}
