"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { confirmarPagamento } from "../../actions";

export function ConfirmarPagamentoDialog({
  pedidoId,
  itensComEstoque,
}: {
  pedidoId: string;
  itensComEstoque: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [baixar, setBaixar] = React.useState(true);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await confirmarPagamento(pedidoId, baixar);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Pagamento confirmado${result.data.baixas > 0 ? ` (${result.data.baixas} baixa(s) no estoque)` : ""}`,
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckIcon className="mr-1 size-4" />
          Confirmar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar pagamento</DialogTitle>
          <DialogDescription>
            Marcar este pedido como pago. Você pode baixar automaticamente os
            itens vinculados a estoque.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {itensComEstoque > 0 ? (
            <label className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
              <input
                type="checkbox"
                checked={baixar}
                onChange={(e) => setBaixar(e.target.checked)}
                className="size-4"
              />
              <span>
                Baixar do estoque ({itensComEstoque} item
                {itensComEstoque === 1 ? "" : "s"} vinculado
                {itensComEstoque === 1 ? "" : "s"})
              </span>
            </label>
          ) : (
            <p className="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
              Nenhum item está vinculado a estoque — não haverá baixa
              automática.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Confirmando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
