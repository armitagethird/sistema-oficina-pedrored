import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, MessageCircleIcon } from "lucide-react";

import { AddCarrinhoButton } from "@/features/loja/components/publico/add-carrinho-button";
import { ProdutoGaleria } from "@/features/loja/components/publico/produto-galeria";
import { CONTATO } from "@/features/loja/contato";
import { getProdutoBySlug } from "@/features/loja/queries";
import { SALDO_BAIXO_THRESHOLD } from "@/features/loja/types";
import { formatBRL } from "@/shared/format/money";

type Params = Promise<{ slug: string }>;

export default async function ProdutoPage({ params }: { params: Params }) {
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

  const statusLabel = sobEncomenda
    ? "SOB ENCOMENDA"
    : saldoBaixo
      ? saldo === 1
        ? "ÚLTIMA UNIDADE"
        : `ÚLTIMAS ${saldo} UNIDADES`
      : "EM ESTOQUE";

  const statusColor = sobEncomenda
    ? "text-amber-400"
    : saldoBaixo
      ? "text-orange-400"
      : "text-emerald-400";

  return (
    <div className="bg-background">
      <div className="border-b border-[color:var(--hairline)] bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
          <Link
            href="/produtos"
            className="text-display inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" />
            Voltar ao catálogo
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <ProdutoGaleria fotos={fotos} alt={produto.titulo} />
          </div>

          <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-5">
              <span className="eyebrow">
                § PEÇA · {statusLabel.replace(/-/g, " ")}
              </span>
              <h1 className="text-display text-4xl uppercase leading-[0.9] tracking-tight md:text-5xl lg:text-6xl">
                {produto.titulo}
              </h1>
            </header>

            <div className="flex flex-col gap-3 border-y border-[color:var(--hairline)] py-6">
              <span className="eyebrow text-muted-foreground">Preço</span>
              <div className="flex items-baseline gap-3">
                <span className="text-display text-num text-6xl leading-none md:text-7xl">
                  {formatBRL(precoFinal)}
                </span>
                {temPromocao ? (
                  <span className="text-num text-lg text-muted-foreground line-through">
                    {formatBRL(produto.preco)}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-display text-num text-xs uppercase tracking-[0.18em] ${statusColor}`}
              >
                · {statusLabel}
                {sobEncomenda ? (
                  <span className="ml-2 text-muted-foreground normal-case tracking-normal">
                    Pedro confirma prazo pelo WhatsApp
                  </span>
                ) : null}
              </span>
            </div>

            {produto.descricao ? (
              <section className="flex flex-col gap-3">
                <span className="eyebrow text-muted-foreground">
                  Descrição técnica
                </span>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85 md:text-base">
                  {produto.descricao}
                </p>
              </section>
            ) : null}

            {produto.frete_info ? (
              <section className="flex flex-col gap-2 border border-[color:var(--hairline)] p-5">
                <span className="eyebrow text-muted-foreground">Entrega</span>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {produto.frete_info}
                </p>
              </section>
            ) : null}

            <div className="flex flex-col gap-3">
              <AddCarrinhoButton
                produto={{
                  id: produto.id,
                  slug: produto.slug,
                  titulo: produto.titulo,
                  preco: precoFinal,
                  fotoUrl: fotos[0] ?? null,
                }}
              />
              <a
                href={CONTATO.whatsapp.href}
                target="_blank"
                rel="noreferrer"
                className="text-display inline-flex items-center justify-center gap-2 border-2 border-foreground bg-transparent px-6 py-3 text-sm uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                <MessageCircleIcon className="size-4" />
                Tirar dúvida com Pedro
              </a>
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-px bg-[color:var(--hairline)]">
              <div className="flex flex-col gap-1 bg-background p-4">
                <dt className="eyebrow text-muted-foreground">Pagamento</dt>
                <dd className="text-display text-sm uppercase tracking-tight">
                  PIX
                </dd>
              </div>
              <div className="flex flex-col gap-1 bg-background p-4">
                <dt className="eyebrow text-muted-foreground">Retirada</dt>
                <dd className="text-display text-sm uppercase tracking-tight">
                  São Luís / MA
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <a
        href={CONTATO.whatsapp.href}
        target="_blank"
        rel="noreferrer"
        className="text-display fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 border-2 border-[color:var(--accent-red)] bg-[color:var(--accent-red)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-white shadow-lg transition-colors hover:bg-transparent hover:text-[color:var(--accent-red)] lg:hidden"
        aria-label="Falar com Pedro no WhatsApp"
      >
        <MessageCircleIcon className="size-4" />
        Falar com Pedro
      </a>

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
