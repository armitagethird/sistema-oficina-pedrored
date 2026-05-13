import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AgendamentoComRelacoes,
  AgendaPeriodo,
  OcupacaoDia,
} from "../types";
import { PERIODO_LABEL } from "../types";
import { AgendamentoCard } from "./AgendamentoCard";
import { OcupacaoIndicator } from "./OcupacaoIndicator";

interface Props {
  periodo: AgendaPeriodo;
  agendamentos: AgendamentoComRelacoes[];
  ocupacao: OcupacaoDia | null;
}

export function PeriodoCard({ periodo, agendamentos, ocupacao }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{PERIODO_LABEL[periodo]}</CardTitle>
        {ocupacao && (
          <OcupacaoIndicator
            ocupados={ocupacao.ocupados}
            capacidade={ocupacao.capacidade_efetiva}
            className="mt-1"
          />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {agendamentos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum agendamento
          </p>
        ) : (
          agendamentos.map((ag) => (
            <AgendamentoCard key={ag.id} agendamento={ag} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
