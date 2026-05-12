"use client";

import * as React from "react";
import { ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carrinhoStore } from "./carrinho-store";

type Props = {
  produto: {
    id: string;
    slug: string;
    titulo: string;
    preco: number;
    fotoUrl: string | null;
  };
};

export function AddCarrinhoButton({ produto }: Props) {
  const [qtd, setQtd] = React.useState(1);

  function handleAdd() {
    carrinhoStore.addItem({
      produtoId: produto.id,
      slug: produto.slug,
      titulo: produto.titulo,
      preco: produto.preco,
      fotoUrl: produto.fotoUrl,
      qtd,
    });
    toast.success(`${produto.titulo} adicionado ao carrinho`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="qtd"
          className="text-xs font-medium text-muted-foreground"
        >
          Quantidade
        </label>
        <Input
          id="qtd"
          type="number"
          min={1}
          step={1}
          className="w-24"
          value={qtd}
          onChange={(e) => setQtd(Math.max(1, Number(e.target.value) || 1))}
        />
      </div>
      <Button onClick={handleAdd} size="lg" className="flex-1">
        <ShoppingCartIcon className="mr-2 size-5" />
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
