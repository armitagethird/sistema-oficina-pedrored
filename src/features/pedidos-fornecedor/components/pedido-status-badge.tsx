import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PEDIDO_STATUS_LABEL, type PedidoStatus } from "../types";

const VARIANT: Record<PedidoStatus, string> = {
  cotacao: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  comprado: "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200",
  recebido: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  cancelado: "bg-muted text-muted-foreground line-through",
};

export function PedidoStatusBadge({
  status,
  className,
}: {
  status: PedidoStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0", VARIANT[status], className)}
    >
      {PEDIDO_STATUS_LABEL[status]}
    </Badge>
  );
}
