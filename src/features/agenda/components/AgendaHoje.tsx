import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAgendamentosHoje, getOcupacaoDia } from "../queries";
import { PeriodoCard } from "./PeriodoCard";

export async function AgendaHoje() {
  const hoje = new Date().toISOString().split("T")[0];

  const [agendamentos, ocupacaoManha, ocupacaoTarde] = await Promise.all([
    getAgendamentosHoje(),
    getOcupacaoDia(hoje, "manha"),
    getOcupacaoDia(hoje, "tarde"),
  ]);

  const hojeFormatado = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold capitalize">{hojeFormatado}</h2>
          <p className="text-sm text-muted-foreground">
            {agendamentos.manha.length + agendamentos.tarde.length}{" "}
            agendamento(s)
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/app/agenda/novo">
            <Plus className="size-4" />
            Novo
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PeriodoCard
          periodo="manha"
          agendamentos={agendamentos.manha}
          ocupacao={ocupacaoManha}
        />
        <PeriodoCard
          periodo="tarde"
          agendamentos={agendamentos.tarde}
          ocupacao={ocupacaoTarde}
        />
      </div>
    </div>
  );
}
