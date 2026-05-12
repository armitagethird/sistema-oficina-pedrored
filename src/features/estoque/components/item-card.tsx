import Link from "next/link";
import { ChevronRightIcon, PackageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/shared/format/money";
import type { ItemListItem } from "../queries";
import { AlertaMinimoBadge } from "./alerta-minimo-badge";

export function ItemCard({
  item,
  className,
}: {
  item: ItemListItem;
  className?: string;
}) {
  return (
    <Link
      href={`/app/estoque/${item.id}`}
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-accent",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground shrink-0">
          <PackageIcon className="size-5" />
        </div>
        <div className="flex flex-col min-w-0 gap-1">
          <p className="font-medium truncate">{item.descricao}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {item.categoria?.nome ? (
              <Badge variant="secondary" className="font-normal">
                {item.categoria.nome}
              </Badge>
            ) : null}
            <span>
              {Number(item.quantidade_atual)} {item.unidade}
            </span>
            <span>· {formatBRL(item.preco_venda)}</span>
            {item.sku ? <span>· {item.sku}</span> : null}
            <AlertaMinimoBadge
              qtdAtual={Number(item.quantidade_atual)}
              alertaMinimo={Number(item.alerta_minimo)}
            />
          </div>
        </div>
      </div>
      <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
