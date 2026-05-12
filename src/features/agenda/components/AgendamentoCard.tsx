import Link from "next/link";
import { Car, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { descreveVeiculo } from "@/features/veiculos/types";
import type { AgendamentoComRelacoes } from "../types";
import { AgendaStatusBadge } from "./AgendaStatusBadge";

interface Props {
  agendamento: AgendamentoComRelacoes;
}

export function AgendamentoCard({ agendamento: ag }: Props) {
  return (
    <Link href={`/app/agenda/${ag.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-accent/50">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ag.descricao}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {ag.clientes && (
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {ag.clientes.nome}
                  </span>
                )}
                {ag.veiculos && (
                  <span className="flex items-center gap-1">
                    <Car className="size-3" />
                    {descreveVeiculo(ag.veiculos)}
                  </span>
                )}
              </div>
            </div>
            <AgendaStatusBadge status={ag.status} />
          </div>
          {ag.os_id && (
            <p className="mt-1.5 text-xs text-muted-foreground">OS vinculada</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
