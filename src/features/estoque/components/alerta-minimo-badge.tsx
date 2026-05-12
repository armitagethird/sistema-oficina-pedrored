import { AlertTriangleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function AlertaMinimoBadge({
  qtdAtual,
  alertaMinimo,
}: {
  qtdAtual: number;
  alertaMinimo: number;
}) {
  if (alertaMinimo <= 0 || qtdAtual > alertaMinimo) return null;
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangleIcon className="size-3" />
      Estoque baixo
    </Badge>
  );
}
