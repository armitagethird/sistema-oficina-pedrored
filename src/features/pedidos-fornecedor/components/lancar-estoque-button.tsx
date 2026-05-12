"use client";

import * as React from "react";
import { ArrowDownToLineIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { lancarPedidoNoEstoque } from "../actions";

type Props = {
  pedidoId: string;
  itensComEstoque: number;
  entradasLancadas: number;
};

export function LancarEstoqueButton({
  pedidoId,
  itensComEstoque,
  entradasLancadas,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  if (itensComEstoque === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Vincule itens a estoque para registrar entradas automaticamente.
      </p>
    );
  }

  function handleClick() {
    const msg =
      entradasLancadas > 0
        ? `Já há ${entradasLancadas} entrada(s) lançada(s) deste pedido. Quer lançar novamente? (entradas duplicadas)`
        : `Lançar ${itensComEstoque} entrada(s) no estoque?`;
    if (!window.confirm(msg)) return;
    startTransition(async () => {
      const result = await lancarPedidoNoEstoque(pedidoId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.entradas} entrada(s) lançada(s) no estoque`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={pending}
      >
        <ArrowDownToLineIcon className="mr-1 size-4" />
        {pending ? "Lançando..." : "Lançar entradas no estoque"}
      </Button>
      {entradasLancadas > 0 ? (
        <p className="text-xs text-muted-foreground">
          {entradasLancadas} entrada(s) já registrada(s)
        </p>
      ) : null}
    </div>
  );
}
