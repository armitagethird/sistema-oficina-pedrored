import { beforeEach, describe, expect, it, vi } from "vitest";

import { carrinhoStore } from "./carrinho-store";

const SAMPLE = {
  produtoId: "p1",
  slug: "produto-1",
  titulo: "Produto 1",
  preco: 50,
};

const SAMPLE_2 = {
  produtoId: "p2",
  slug: "produto-2",
  titulo: "Produto 2",
  preco: 25,
};

describe("carrinhoStore", () => {
  beforeEach(() => {
    carrinhoStore._resetForTests();
  });

  it("começa vazio", () => {
    expect(carrinhoStore.getState().items).toEqual([]);
    expect(carrinhoStore.totalItens()).toBe(0);
    expect(carrinhoStore.totalValor()).toBe(0);
  });

  it("addItem adiciona com qtd default 1", () => {
    carrinhoStore.addItem(SAMPLE);
    expect(carrinhoStore.getState().items).toHaveLength(1);
    expect(carrinhoStore.getState().items[0].qtd).toBe(1);
  });

  it("addItem mesmo produtoId incrementa qtd", () => {
    carrinhoStore.addItem(SAMPLE);
    carrinhoStore.addItem(SAMPLE);
    carrinhoStore.addItem({ ...SAMPLE, qtd: 3 });
    expect(carrinhoStore.getState().items).toHaveLength(1);
    expect(carrinhoStore.getState().items[0].qtd).toBe(5);
  });

  it("updateQty define qtd; 0 ou negativo remove", () => {
    carrinhoStore.addItem(SAMPLE);
    carrinhoStore.updateQty("p1", 4);
    expect(carrinhoStore.getState().items[0].qtd).toBe(4);
    carrinhoStore.updateQty("p1", 0);
    expect(carrinhoStore.getState().items).toHaveLength(0);
  });

  it("removeItem remove pelo produtoId", () => {
    carrinhoStore.addItem(SAMPLE);
    carrinhoStore.addItem(SAMPLE_2);
    carrinhoStore.removeItem("p1");
    expect(carrinhoStore.getState().items).toHaveLength(1);
    expect(carrinhoStore.getState().items[0].produtoId).toBe("p2");
  });

  it("clear esvazia tudo", () => {
    carrinhoStore.addItem(SAMPLE);
    carrinhoStore.addItem(SAMPLE_2);
    carrinhoStore.clear();
    expect(carrinhoStore.getState().items).toEqual([]);
  });

  it("totalItens soma quantidades", () => {
    carrinhoStore.addItem({ ...SAMPLE, qtd: 2 });
    carrinhoStore.addItem({ ...SAMPLE_2, qtd: 3 });
    expect(carrinhoStore.totalItens()).toBe(5);
  });

  it("totalValor soma preco*qtd", () => {
    carrinhoStore.addItem({ ...SAMPLE, qtd: 2 }); // 100
    carrinhoStore.addItem({ ...SAMPLE_2, qtd: 4 }); // 100
    expect(carrinhoStore.totalValor()).toBe(200);
  });

  it("persiste em localStorage e recarrega", () => {
    carrinhoStore.addItem(SAMPLE);
    const raw = window.localStorage.getItem("pedrored-carrinho");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.items).toHaveLength(1);

    // Limpa só o estado em memória, depois recarrega
    carrinhoStore.clear(); // limpa e persiste vazio
    // Simulamos recarga manualmente: gravar via localStorage e reload()
    window.localStorage.setItem(
      "pedrored-carrinho",
      JSON.stringify({ items: [{ ...SAMPLE, qtd: 7 }] }),
    );
    carrinhoStore._reload();
    expect(carrinhoStore.getState().items).toHaveLength(1);
    expect(carrinhoStore.getState().items[0].qtd).toBe(7);
  });

  it("subscribe é chamado quando state muda", () => {
    const listener = vi.fn();
    const unsub = carrinhoStore.subscribe(listener);
    carrinhoStore.addItem(SAMPLE);
    carrinhoStore.addItem(SAMPLE);
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    carrinhoStore.addItem(SAMPLE);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
