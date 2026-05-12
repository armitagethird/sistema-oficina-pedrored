"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, PackageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Item } from "../types";

export type ItemComboboxValue = Pick<
  Item,
  "id" | "descricao" | "unidade" | "quantidade_atual" | "custo_medio" | "preco_venda"
>;

type ItemComboboxProps = {
  value?: string | null;
  onSelect: (item: ItemComboboxValue) => void;
  placeholder?: string;
  disabled?: boolean;
};

const SELECT_COLS =
  "id, descricao, unidade, quantidade_atual, custo_medio, preco_venda";

export function ItemCombobox({
  value,
  onSelect,
  placeholder = "Selecione um item",
  disabled,
}: ItemComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<ItemComboboxValue[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<ItemComboboxValue | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    const term = search.trim();
    const query = supabase
      .from("itens_estoque")
      .select(SELECT_COLS)
      .is("deletado_em", null)
      .eq("ativo", true)
      .order("descricao", { ascending: true })
      .limit(20);

    const promise = term
      ? query.or(`descricao.ilike.%${term}%,sku.ilike.%${term}%`)
      : query;

    promise.then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) setItems(data as ItemComboboxValue[]);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [search]);

  React.useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    const local = items.find((i) => i.id === value);
    if (local) {
      setSelected(local);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("itens_estoque")
      .select(SELECT_COLS)
      .eq("id", value)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setSelected(data as ItemComboboxValue);
      });
    return () => {
      cancelled = true;
    };
  }, [value, items]);

  function handleSelect(item: ItemComboboxValue) {
    setSelected(item);
    onSelect(item);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span
            className={cn(
              "truncate flex items-center gap-2",
              !selected && "text-muted-foreground",
            )}
          >
            <PackageIcon className="size-4 shrink-0 opacity-60" />
            {selected ? (
              <>
                <span className="truncate">{selected.descricao}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  · {Number(selected.quantidade_atual)} {selected.unidade}
                </span>
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar item por descrição ou SKU..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 size-4",
                          selected?.id === item.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{item.descricao}</span>
                        <span className="text-xs text-muted-foreground">
                          {Number(item.quantidade_atual)} {item.unidade}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
