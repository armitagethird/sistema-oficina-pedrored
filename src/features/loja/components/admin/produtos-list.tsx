import Link from "next/link";
import { ChevronRightIcon, PackageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/shared/format/money";
import type { Produto } from "../../types";
import { PRODUTO_STATUS_LABEL } from "../../types";

const BADGE_VARIANT: Record<
  Produto["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  ativo: "default",
  inativo: "outline",
  esgotado: "destructive",
};

export function ProdutosList({ produtos }: { produtos: Produto[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {produtos.map((p) => {
        const fotos = Array.isArray(p.fotos) ? (p.fotos as string[]) : [];
        return (
          <li key={p.id}>
            <Link
              href={`/app/loja/produtos/${p.id}`}
              className="flex items-center gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-accent"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {fotos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fotos[0]}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground">
                    <PackageIcon className="size-5" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <p className="truncate font-medium">{p.titulo}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant={BADGE_VARIANT[p.status]}
                    className="font-normal"
                  >
                    {PRODUTO_STATUS_LABEL[p.status]}
                  </Badge>
                  <span>{formatBRL(p.preco)}</span>
                  {p.destaque ? <span>· destaque</span> : null}
                </div>
              </div>
              <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
