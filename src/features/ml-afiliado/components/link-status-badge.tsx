import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LINK_STATUS_LABEL, type LinkAfiliadoStatus } from "../types";

const VARIANT: Record<LinkAfiliadoStatus, string> = {
  enviado: "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  cliente_comprou:
    "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200",
  comissao_recebida:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  cancelado: "bg-muted text-muted-foreground line-through",
};

export function LinkStatusBadge({
  status,
  className,
}: {
  status: LinkAfiliadoStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0", VARIANT[status], className)}
    >
      {LINK_STATUS_LABEL[status]}
    </Badge>
  );
}
