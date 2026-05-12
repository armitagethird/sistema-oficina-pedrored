import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddCarrinhoButton } from "@/features/loja/components/publico/add-carrinho-button";
import { ProdutoGaleria } from "@/features/loja/components/publico/produto-galeria";
import { getProdutoBySlug } from "@/features/loja/queries";
import { SALDO_BAIXO_THRESHOLD } from "@/features/loja/types";
import { formatBRL } from "@/shared/format/money";

type Params = Promise<{ slug: string }>;

export default async function ProdutoPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const produto = await getProdutoBySlug(slug);
  if (!produto) notFound();

  const fotos = Array.isArray(produto.fotos) ? (produto.fotos as string[]) : [];
  const temPromocao =
    produto.preco_promocional != null &&
    Number(produto.preco_promocional) > 0 &&
    Number(produto.preco_promocional) < Number(produto.preco);
  const precoFinal = Number(
    temPromocao ? (produto.preco_promocional as number) : produto.preco,
  );

  const sobEncomenda = produto.somente_sob_encomenda;
  const saldo = produto.quantidade_estoque;
  const saldoBaixo =
    !sobEncomenda &&
    saldo != null &&
    saldo > 0 &&
    saldo <= SALDO_BAIXO_THRESHOLD;
  const availability = sobEncomenda
    ? "https://schema.org/BackOrder"
    : "https://schema.org/InStock";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 md:px-6 md:py-10">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/produtos">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar ao catálogo
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <ProdutoGaleria fotos={fotos} alt={produto.titulo} />

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {produto.titulo}
          </h1>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatBRL(precoFinal)}</span>
            {temPromocao ? (
              <span className="text-base text-muted-foreground line-through">
                {formatBRL(produto.preco)}
              </span>
            ) : null}
          </div>
          {sobEncomenda ? (
            <Badge
              variant="outline"
              className="w-fit border-amber-500/50 text-amber-700 dark:text-amber-300"
            >
              Sob encomenda — Pedro confirma o prazo no WhatsApp
            </Badge>
          ) : saldoBaixo ? (
            <Badge
              variant="outline"
              className="w-fit border-orange-500/50 text-orange-700 dark:text-orange-300"
            >
              {saldo === 1 ? "Última unidade" : `Últimas ${saldo} unidades`}
            </Badge>
          ) : null}

          {produto.descricao ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {produto.descricao}
            </p>
          ) : null}

          {produto.frete_info ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Entrega
              </p>
              <p className="mt-1">{produto.frete_info}</p>
            </div>
          ) : null}

          <AddCarrinhoButton
            produto={{
              id: produto.id,
              slug: produto.slug,
              titulo: produto.titulo,
              preco: precoFinal,
              fotoUrl: fotos[0] ?? null,
            }}
          />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: produto.titulo,
            description: produto.descricao ?? undefined,
            image: fotos.length > 0 ? fotos : undefined,
            offers: {
              "@type": "Offer",
              price: precoFinal.toFixed(2),
              priceCurrency: "BRL",
              availability,
            },
          }),
        }}
      />
    </div>
  );
}
