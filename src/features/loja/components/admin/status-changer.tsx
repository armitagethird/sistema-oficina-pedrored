"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { atualizarStatusPedido } from "../../actions";
import {
  PEDIDO_LOJA_STATUS_LABEL,
  getNextPedidoLojaStatuses,
  type PedidoLojaStatus,
} from "../../types";

export function StatusChanger({
  pedidoId,
  current,
}: {
  pedidoId: string;
  current: PedidoLojaStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const next = getNextPedidoLojaStatuses(current);

  if (next.length === 0) return null;

  function change(novoStatus: PedidoLojaStatus) {
    startTransition(async () => {
      const result = await atualizarStatusPedido(pedidoId, novoStatus);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Status: ${PEDIDO_LOJA_STATUS_LABEL[novoStatus]}`);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          Mudar status
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {next.map((s) => (
          <DropdownMenuItem key={s} onClick={() => change(s)}>
            {PEDIDO_LOJA_STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
