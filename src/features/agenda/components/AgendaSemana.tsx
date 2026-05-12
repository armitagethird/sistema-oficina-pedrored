import Link from "next/link";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgendamentosSemana } from "../queries";
import { PERIODO_LABEL } from "../types";
import { AgendamentoCard } from "./AgendamentoCard";

interface Props {
  semanaOffset?: number;
}

export async function AgendaSemana({ semanaOffset = 0 }: Props) {
  const base = addWeeks(new Date(), semanaOffset);
  const inicio = startOfWeek(base, { weekStartsOn: 1 });
  const fim = endOfWeek(base, { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: inicio, end: fim });

  const dataInicio = format(inicio, "yyyy-MM-dd");
  const dataFim = format(fim, "yyyy-MM-dd");
  const agendamentos = await getAgendamentosSemana(dataInicio, dataFim);

  const porDia = new Map<string, typeof agendamentos>();
  for (const ag of agendamentos) {
    const lista = porDia.get(ag.data) ?? [];
    lista.push(ag);
    porDia.set(ag.data, lista);
  }

  const prevOffset = semanaOffset - 1;
  const nextOffset = semanaOffset + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(inicio, "d MMM", { locale: ptBR })} –{" "}
          {format(fim, "d MMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/app/agenda/semana?offset=${prevOffset}`}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/agenda/semana">Hoje</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/app/agenda/semana?offset=${nextOffset}`}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {dias.map((dia) => {
          const key = format(dia, "yyyy-MM-dd");
          const ags = porDia.get(key) ?? [];
          const manha = ags.filter((a) => a.periodo === "manha");
          const tarde = ags.filter((a) => a.periodo === "tarde");
          const isHoje = key === format(new Date(), "yyyy-MM-dd");

          return (
            <Card key={key} className={isHoje ? "border-primary" : undefined}>
              <CardHeader className="py-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className={isHoje ? "font-bold text-primary" : ""}>
                    {format(dia, "EEEE, d/MM", { locale: ptBR })}
                  </span>
                  {ags.length > 0 && (
                    <span className="font-normal text-xs text-muted-foreground">
                      {ags.length} agendamento(s)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              {ags.length > 0 && (
                <CardContent className="space-y-3 pt-0">
                  {(["manha", "tarde"] as const).map((p) => {
                    const lista = p === "manha" ? manha : tarde;
                    if (lista.length === 0) return null;
                    return (
                      <div key={p}>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          {PERIODO_LABEL[p]}
                        </p>
                        <div className="space-y-1.5">
                          {lista.map((ag) => (
                            <AgendamentoCard key={ag.id} agendamento={ag} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
