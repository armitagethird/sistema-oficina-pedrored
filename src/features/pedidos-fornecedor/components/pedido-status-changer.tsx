"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mudarStatusPedido } from "../actions";
import { getNextPedidoStatuses, PEDIDO_STATUS_LABEL, type PedidoStatus } from "../types";

export function PedidoStatusChanger({
  pedidoId,
  current,
}: {
  pedidoId: string;
  current: PedidoStatus;
}) {
  const [pending, startTransition] = React.useTransition();
  const next = getNextPedidoStatuses(current);

  if (next.length === 0) {
    return null;
  }

  function handleChange(newStatus: PedidoStatus) {
    startTransition(async () => {
      const result = await mudarStatusPedido(pedidoId, newStatus);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Status alterado para ${PEDIDO_STATUS_LABEL[newStatus]}`);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Alterar status"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {next.map((s) => (
          <DropdownMenuItem key={s} onClick={() => handleChange(s)}>
            {PEDIDO_STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
