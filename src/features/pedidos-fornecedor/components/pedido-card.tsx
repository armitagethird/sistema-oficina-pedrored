import Link from "next/link";
import { ChevronRightIcon, ReceiptIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBRL } from "@/shared/format/money";
import type { PedidoListItem } from "../queries";
import { PedidoStatusBadge } from "./pedido-status-badge";

export function PedidoCard({
  pedido,
  className,
}: {
  pedido: PedidoListItem;
  className?: string;
}) {
  return (
    <Link
      href={`/app/pedidos-fornecedor/${pedido.id}`}
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-accent",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground shrink-0">
          <ReceiptIcon className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <p className="font-medium truncate">
            #{pedido.numero} · {pedido.fornecedor?.nome ?? "Fornecedor"}
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground truncate">
            <PedidoStatusBadge status={pedido.status} />
            <span>{formatBRL(pedido.valor_total)}</span>
            {pedido.os ? (
              <span className="truncate">
                · OS #{pedido.os.numero}
                {pedido.os.cliente ? ` · ${pedido.os.cliente.nome}` : ""}
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
