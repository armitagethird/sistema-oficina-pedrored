"use client";

import Link from "next/link";
import { MinusIcon, PlusIcon, ShoppingCartIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  carrinhoStore,
  useCarrinho,
} from "@/features/loja/components/publico/carrinho-store";
import { formatBRL } from "@/shared/format/money";

export default function CarrinhoPage() {
  const state = useCarrinho();
  const total = state.items.reduce((s, i) => s + i.preco * i.qtd, 0);

  if (state.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-12 text-center md:px-6">
        <div className="grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
          <ShoppingCartIcon className="size-8" />
        </div>
        <h1 className="text-2xl font-semibold">Seu carrinho está vazio</h1>
        <p className="text-sm text-muted-foreground">
          Adicione produtos do catálogo pra começar.
        </p>
        <Button asChild>
          <Link href="/produtos">Ver catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 md:px-6 md:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Seu carrinho</h1>

      <ul className="flex flex-col gap-3">
        {state.items.map((it) => (
          <li
            key={it.produtoId}
            className="flex items-center gap-3 rounded-md border bg-card p-3"
          >
            <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {it.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.fotoUrl}
                  alt={it.titulo}
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <Link
                href={`/produto/${it.slug}`}
                className="truncate text-sm font-medium hover:underline"
              >
                {it.titulo}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatBRL(it.preco)} cada
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() =>
                  carrinhoStore.updateQty(it.produtoId, it.qtd - 1)
                }
              >
                <MinusIcon className="size-3" />
              </Button>
              <Input
                value={it.qtd}
                onChange={(e) =>
                  carrinhoStore.updateQty(
                    it.produtoId,
                    Math.max(0, Number(e.target.value) || 0),
                  )
                }
                className="h-8 w-12 text-center"
                inputMode="numeric"
              />
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() =>
                  carrinhoStore.updateQty(it.produtoId, it.qtd + 1)
                }
              >
                <PlusIcon className="size-3" />
              </Button>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-semibold">
                {formatBRL(it.preco * it.qtd)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => carrinhoStore.removeItem(it.produtoId)}
                aria-label={`Remover ${it.titulo}`}
              >
                <TrashIcon className="size-3" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-between rounded-md border bg-muted/30 px-4 py-3 text-base font-semibold">
        <span>Total</span>
        <span>{formatBRL(total)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/produtos">Continuar comprando</Link>
        </Button>
        <Button asChild size="lg" className="flex-1">
          <Link href="/checkout">Finalizar compra</Link>
        </Button>
      </div>
    </div>
  );
}
