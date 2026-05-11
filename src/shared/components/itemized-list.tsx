"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ItemizedListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  addLabel?: string;
  emptyLabel?: string;
  className?: string;
};

export function ItemizedList<T>({
  items,
  renderItem,
  onAdd,
  onRemove,
  addLabel = "Adicionar",
  emptyLabel = "Nenhum item.",
  className,
}: ItemizedListProps<T>) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-2 rounded-md border bg-card p-3"
            >
              <div className="flex-1 min-w-0">{renderItem(item, index)}</div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                aria-label="Remover item"
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="self-start"
      >
        <PlusIcon className="mr-1 size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
