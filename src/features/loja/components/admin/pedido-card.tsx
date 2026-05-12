import Link from "next/link";
import { ChevronRightIcon, ReceiptIcon } from "lucide-react";

import { formatBRL } from "@/shared/format/money";
import type { PedidoLojaListItem } from "../../queries";
import { PedidoStatusBadge } from "../publico/pedido-status-publico";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function PedidoCard({ pedido }: { pedido: PedidoLojaListItem }) {
  return (
    <Link
      href={`/app/loja/pedidos/${pedido.id}`}
      className="flex items-center gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-accent"
    >
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground shrink-0">
        <ReceiptIcon className="size-5" />
      </div>
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">
            #{pedido.numero} · {pedido.cliente_nome}
          </p>
          <PedidoStatusBadge status={pedido.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{DATE_FORMATTER.format(new Date(pedido.criado_em))}</span>
          <span>· {pedido.itens_count} itens</span>
          <span>· {formatBRL(pedido.valor_total)}</span>
        </div>
      </div>
      <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
