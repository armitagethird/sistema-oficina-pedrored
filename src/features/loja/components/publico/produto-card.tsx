import Link from "next/link";
import { PackageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/shared/format/money";
import type { Produto } from "../../types";

export function ProdutoCard({ produto }: { produto: Produto }) {
  const fotos = Array.isArray(produto.fotos) ? (produto.fotos as string[]) : [];
  const fotoPrincipal = fotos[0];
  const temPromocao =
    produto.preco_promocional != null &&
    Number(produto.preco_promocional) > 0 &&
    Number(produto.preco_promocional) < Number(produto.preco);

  return (
    <Link
      href={`/produto/${produto.slug}`}
      className="group flex flex-col gap-2 rounded-lg border bg-card transition-colors hover:border-red-300"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
        {fotoPrincipal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoPrincipal}
            alt={produto.titulo}
            className="size-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <PackageIcon className="size-10" />
          </div>
        )}
        {produto.destaque ? (
          <Badge className="absolute left-2 top-2 bg-red-600">Destaque</Badge>
        ) : null}
        {temPromocao ? (
          <Badge variant="secondary" className="absolute right-2 top-2">
            Promoção
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {produto.titulo}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold">
            {formatBRL(
              temPromocao
                ? (produto.preco_promocional as number)
                : produto.preco,
            )}
          </span>
          {temPromocao ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatBRL(produto.preco)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
