"use client";

import * as React from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteCategoria } from "../actions";
import type { Categoria } from "../types";
import { CategoriaForm } from "./categoria-form";

export function CategoriasManager({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Categoria | null>(null);

  async function handleDelete(categoria: Categoria) {
    if (
      !window.confirm(
        `Remover categoria "${categoria.nome}"? Categorias com itens vinculados não podem ser removidas.`,
      )
    ) {
      return;
    }
    const result = await deleteCategoria(categoria.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Categoria removida");
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-1 size-4" />
              Nova categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova categoria</DialogTitle>
            </DialogHeader>
            <CategoriaForm onSuccess={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <ul className="flex flex-col gap-2">
        {categorias.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-md border bg-card p-3"
          >
            <div className="flex flex-col">
              <p className="font-medium">{c.nome}</p>
              <p className="text-xs text-muted-foreground">Ordem: {c.ordem}</p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(c)}
                aria-label={`Editar ${c.nome}`}
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(c)}
                aria-label={`Remover ${c.nome}`}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
          </DialogHeader>
          {editing ? (
            <CategoriaForm
              categoria={editing}
              onSuccess={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
