"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
} from "lucide-react";

import {
  carrinhoStore,
  useCarrinho,
} from "@/features/loja/components/publico/carrinho-store";
import { formatBRL } from "@/shared/format/money";

export default function CarrinhoPage() {
  const state = useCarrinho();
  const total = state.items.reduce((s, i) => s + i.preco * i.qtd, 0);
  const totalItens = state.items.reduce((s, i) => s + i.qtd, 0);

  if (state.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-20 text-center md:px-8 md:py-32">
        <span className="eyebrow">§ CARRINHO VAZIO</span>
        <ShoppingCartIcon
          aria-hidden
          className="size-16 text-[color:var(--accent-red)]"
          strokeWidth={1.25}
        />
        <h1 className="text-display text-4xl uppercase leading-[0.9] md:text-6xl">
          Nada por aqui
          <br />
          ainda
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
          Adicione peças do catálogo pra começar. Pedro despacha após
          confirmação do PIX.
        </p>
        <Link
          href="/produtos"
          className="text-display inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-8 py-4 text-sm uppercase tracking-[0.2em] text-background transition-colors hover:bg-transparent hover:text-foreground"
        >
          Ver catálogo
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <section className="border-b border-[color:var(--hairline)]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
          <div className="flex flex-col gap-5">
            <span className="eyebrow">§ SEU CARRINHO</span>
            <h1 className="text-display text-5xl uppercase leading-[0.85] md:text-7xl lg:text-8xl">
              Resumo
              <br />
              do pedido
            </h1>
            <p className="text-num text-sm uppercase tracking-[0.16em] text-muted-foreground">
              {String(totalItens).padStart(2, "0")}{" "}
              {totalItens === 1 ? "item" : "itens"} ·{" "}
              {String(state.items.length).padStart(2, "0")}{" "}
              {state.items.length === 1 ? "referência" : "referências"}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <ul className="flex flex-col divide-y divide-[color:var(--hairline)] border-y border-[color:var(--hairline)]">
            {state.items.map((it, index) => (
              <li
                key={it.produtoId}
                className="grid grid-cols-[auto_1fr] items-start gap-4 py-6 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center sm:gap-6"
              >
                <div className="relative size-20 shrink-0 overflow-hidden bg-muted sm:size-24">
                  {it.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.fotoUrl}
                      alt={it.titulo}
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-num text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Item {String(index + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={`/produto/${it.slug}`}
                    className="text-display line-clamp-2 text-base uppercase leading-tight transition-colors hover:text-[color:var(--accent-red)] sm:text-lg"
                  >
                    {it.titulo}
                  </Link>
                  <span className="text-num text-xs text-muted-foreground">
                    {formatBRL(it.preco)} cada
                  </span>
                </div>

                <div className="col-span-2 flex items-center gap-3 sm:col-span-1 sm:justify-self-end">
                  <div className="flex items-center border border-[color:var(--hairline)]">
                    <button
                      type="button"
                      onClick={() =>
                        carrinhoStore.updateQty(it.produtoId, it.qtd - 1)
                      }
                      className="grid size-9 place-items-center text-foreground transition-colors hover:bg-foreground hover:text-background"
                      aria-label="Diminuir quantidade"
                    >
                      <MinusIcon className="size-3" />
                    </button>
                    <input
                      value={it.qtd}
                      onChange={(e) =>
                        carrinhoStore.updateQty(
                          it.produtoId,
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                      className="text-display text-num w-10 bg-transparent py-2 text-center text-sm focus:outline-none"
                      inputMode="numeric"
                      aria-label={`Quantidade de ${it.titulo}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        carrinhoStore.updateQty(it.produtoId, it.qtd + 1)
                      }
                      className="grid size-9 place-items-center text-foreground transition-colors hover:bg-foreground hover:text-background"
                      aria-label="Aumentar quantidade"
                    >
                      <PlusIcon className="size-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => carrinhoStore.removeItem(it.produtoId)}
                    className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-[color:var(--accent-red)]"
                    aria-label={`Remover ${it.titulo}`}
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
                <div className="col-span-2 flex justify-end sm:col-span-1 sm:justify-self-end">
                  <span className="text-display text-num text-2xl leading-none md:text-3xl">
                    {formatBRL(it.preco * it.qtd)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[color:var(--hairline)] bg-card">
              <div className="border-b border-[color:var(--hairline)] p-6 md:p-8">
                <span className="eyebrow text-muted-foreground">
                  § Total do pedido
                </span>
                <p className="mt-4 flex items-baseline justify-between gap-4">
                  <span className="text-display text-sm uppercase tracking-[0.16em] text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-display text-num text-4xl leading-none md:text-5xl">
                    {formatBRL(total)}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-3 p-6 md:p-8">
                <Link
                  href="/checkout"
                  className="text-display inline-flex items-center justify-center gap-2 border-2 border-foreground bg-foreground px-6 py-4 text-sm uppercase tracking-[0.2em] text-background transition-colors hover:bg-transparent hover:text-foreground"
                >
                  Finalizar compra
                  <ArrowRightIcon className="size-4" />
                </Link>
                <Link
                  href="/produtos"
                  className="text-display inline-flex items-center justify-center gap-2 border-2 border-foreground bg-transparent px-6 py-4 text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Continuar comprando
                </Link>
              </div>
            </div>
            <p className="mt-6 text-num text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Pagamento via PIX · Confirmação manual do Pedro · Retira em São
              Luís ou combina entrega
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
