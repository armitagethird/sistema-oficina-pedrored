import { Badge } from "@/components/ui/badge";
import {
  PEDIDO_LOJA_STATUS_LABEL,
  type PedidoLojaStatus,
} from "../../types";

const VARIANT: Record<
  PedidoLojaStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  aguardando_pagamento: "outline",
  pagamento_em_analise: "secondary",
  pago: "default",
  em_separacao: "default",
  enviado: "default",
  retirado: "default",
  cancelado: "destructive",
};

export function PedidoStatusBadge({ status }: { status: PedidoLojaStatus }) {
  return (
    <Badge variant={VARIANT[status]} className="font-normal">
      {PEDIDO_LOJA_STATUS_LABEL[status]}
    </Badge>
  );
}
