import Link from "next/link";
import { PackageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBRL } from "@/shared/format/money";
import { SALDO_BAIXO_THRESHOLD, type ProdutoComEstoque } from "../../types";

interface ProdutoCardProps {
  produto: ProdutoComEstoque;
  featured?: boolean;
}

export function ProdutoCard({ produto, featured = false }: ProdutoCardProps) {
  const fotos = Array.isArray(produto.fotos) ? (produto.fotos as string[]) : [];
  const fotoPrincipal = fotos[0];
  const temPromocao =
    produto.preco_promocional != null &&
    Number(produto.preco_promocional) > 0 &&
    Number(produto.preco_promocional) < Number(produto.preco);

  const sobEncomenda = produto.somente_sob_encomenda;
  const saldo = produto.quantidade_estoque;
  const saldoBaixo =
    !sobEncomenda &&
    saldo != null &&
    saldo > 0 &&
    saldo <= SALDO_BAIXO_THRESHOLD;

  return (
    <Link
      href={`/produto/${produto.slug}`}
      className={cn(
        "group relative flex h-full flex-col bg-card transition-colors hover:bg-card/80",
        featured && "col-span-2 md:row-span-2",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {fotoPrincipal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoPrincipal}
            alt={produto.titulo}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading={featured ? "eager" : "lazy"}
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <PackageIcon className={cn("size-10", featured && "size-20")} />
          </div>
        )}
        <div className="absolute left-0 top-0 flex flex-col items-start gap-1 p-3">
          {produto.destaque ? (
            <span className="text-display bg-[color:var(--accent-red)] px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-white">
              Destaque
            </span>
          ) : null}
          {temPromocao ? (
            <span className="text-display bg-white px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-black">
              Promoção
            </span>
          ) : null}
        </div>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col gap-2 p-4",
          featured && "gap-4 md:p-8 lg:p-10",
        )}
      >
        <h3
          className={cn(
            "text-display line-clamp-2 uppercase leading-tight tracking-tight transition-colors group-hover:text-[color:var(--accent-red)]",
            featured
              ? "text-2xl md:text-3xl lg:text-4xl"
              : "text-base sm:text-lg",
          )}
        >
          {produto.titulo}
        </h3>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-display text-num leading-none",
              featured ? "text-4xl md:text-5xl" : "text-xl md:text-2xl",
            )}
          >
            {formatBRL(
              temPromocao
                ? (produto.preco_promocional as number)
                : produto.preco,
            )}
          </span>
          {temPromocao ? (
            <span className="text-num text-xs text-muted-foreground line-through">
              {formatBRL(produto.preco)}
            </span>
          ) : null}
        </div>
        {sobEncomenda ? (
          <span className="w-fit border border-amber-500/60 px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
            Sob encomenda
          </span>
        ) : saldoBaixo ? (
          <span className="w-fit border border-orange-500/60 px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300">
            {saldo === 1 ? "Última unidade" : `Últimas ${saldo} unidades`}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
