"use client";

import { useSyncExternalStore } from "react";

export type CarrinhoItem = {
  produtoId: string;
  slug: string;
  titulo: string;
  preco: number;
  qtd: number;
  fotoUrl?: string | null;
};

type State = { items: CarrinhoItem[] };
const KEY = "pedrored-carrinho";
const EMPTY: State = { items: [] };

function load(): State {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : EMPTY;
  } catch {
    return EMPTY;
  }
}

const listeners = new Set<() => void>();
let state: State = load();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage cheio ou bloqueado — silenciosamente ignora
  }
}

function emit() {
  for (const l of listeners) l();
}

function set(next: State) {
  state = next;
  persist();
  emit();
}

export const carrinhoStore = {
  getState: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  addItem(item: Omit<CarrinhoItem, "qtd"> & { qtd?: number }) {
    const qtd = item.qtd ?? 1;
    const existing = state.items.find((i) => i.produtoId === item.produtoId);
    set({
      items: existing
        ? state.items.map((i) =>
            i.produtoId === item.produtoId ? { ...i, qtd: i.qtd + qtd } : i,
          )
        : [
            ...state.items,
            {
              produtoId: item.produtoId,
              slug: item.slug,
              titulo: item.titulo,
              preco: item.preco,
              fotoUrl: item.fotoUrl ?? null,
              qtd,
            },
          ],
    });
  },
  updateQty(produtoId: string, qtd: number) {
    if (qtd <= 0) {
      set({ items: state.items.filter((i) => i.produtoId !== produtoId) });
      return;
    }
    set({
      items: state.items.map((i) =>
        i.produtoId === produtoId ? { ...i, qtd } : i,
      ),
    });
  },
  removeItem(produtoId: string) {
    set({ items: state.items.filter((i) => i.produtoId !== produtoId) });
  },
  clear() {
    set({ items: [] });
  },
  totalItens(): number {
    return state.items.reduce((s, i) => s + i.qtd, 0);
  },
  totalValor(): number {
    return state.items.reduce((s, i) => s + i.preco * i.qtd, 0);
  },
  /** Force-reload state from localStorage. Test/SSR boundary helper. */
  _reload() {
    state = load();
    emit();
  },
  /** Reset state to empty without persisting. Test helper. */
  _resetForTests() {
    state = EMPTY;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEY);
    }
    emit();
  },
};

export function useCarrinho() {
  return useSyncExternalStore(
    carrinhoStore.subscribe,
    () => state,
    () => EMPTY,
  );
}
