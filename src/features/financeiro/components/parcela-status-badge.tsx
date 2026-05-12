import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PAGAMENTO_STATUS_LABEL, type PagamentoStatus } from "../types";

const VARIANT: Record<PagamentoStatus, string> = {
  pendente: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  pago: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  atrasado: "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200",
  cancelado: "bg-muted text-muted-foreground line-through",
};

export function ParcelaStatusBadge({
  status,
  className,
}: {
  status: PagamentoStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0", VARIANT[status], className)}
    >
      {PAGAMENTO_STATUS_LABEL[status]}
    </Badge>
  );
}
