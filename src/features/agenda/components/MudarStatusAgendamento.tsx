"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { mudarStatusAgendamento } from "../actions";
import { getNextStatuses, STATUS_LABEL, type AgendaStatus } from "../types";

interface Props {
  agendamentoId: string;
  statusAtual: AgendaStatus;
}

export function MudarStatusAgendamento({ agendamentoId, statusAtual }: Props) {
  const [isPending, startTransition] = useTransition();
  const proximos = getNextStatuses(statusAtual);

  if (proximos.length === 0) return null;

  function handleMudar(novoStatus: AgendaStatus) {
    startTransition(async () => {
      const result = await mudarStatusAgendamento(agendamentoId, novoStatus);
      if (result.ok) {
        toast.success(`Status: ${STATUS_LABEL[novoStatus]}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {proximos.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={
            s === "cancelado" || s === "nao_compareceu"
              ? "destructive"
              : "default"
          }
          disabled={isPending}
          onClick={() => handleMudar(s)}
        >
          {STATUS_LABEL[s]}
        </Button>
      ))}
    </div>
  );
}
