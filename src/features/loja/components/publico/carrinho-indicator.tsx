"use client";

import Link from "next/link";
import { ShoppingCartIcon } from "lucide-react";

import { useCarrinho } from "./carrinho-store";
import { carrinhoStore } from "./carrinho-store";

export function CarrinhoIndicator() {
  const state = useCarrinho();
  const total = state.items.reduce((s, i) => s + i.qtd, 0);

  // Recarrega do localStorage no mount (necessário porque o SSR snapshot é vazio)
  if (
    typeof window !== "undefined" &&
    total === 0 &&
    window.localStorage.getItem("pedrored-carrinho")
  ) {
    carrinhoStore._reload();
  }

  return (
    <Link
      href="/carrinho"
      className="relative flex items-center gap-1 text-neutral-300 transition-colors hover:text-white"
      aria-label={`Carrinho com ${total} item${total === 1 ? "" : "s"}`}
    >
      <ShoppingCartIcon className="size-5" />
      {total > 0 ? (
        <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
          {total}
        </span>
      ) : null}
    </Link>
  );
}
