"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Fornecedor } from "../types";
import { FornecedorForm } from "./fornecedor-form";

type FornecedorComboboxProps = {
  value?: string | null;
  onSelect: (fornecedor: Fornecedor) => void;
  placeholder?: string;
};

export function FornecedorCombobox({
  value,
  onSelect,
  placeholder = "Selecione um fornecedor",
}: FornecedorComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<Fornecedor[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Fornecedor | null>(null);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    const term = search.trim();
    const query = supabase
      .from("fornecedores")
      .select("*")
      .is("deletado_em", null)
      .order("nome", { ascending: true })
      .limit(20);

    const promise = term
      ? query.or(`nome.ilike.%${term}%,telefone.ilike.%${term}%,cnpj.ilike.%${term}%`)
      : query;

    promise.then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) setItems(data);
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
    const local = items.find((f) => f.id === value);
    if (local) {
      setSelected(local);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("fornecedores")
      .select("*")
      .eq("id", value)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setSelected(data);
      });
    return () => {
      cancelled = true;
    };
  }, [value, items]);

  function handleSelect(fornecedor: Fornecedor) {
    setSelected(fornecedor);
    onSelect(fornecedor);
    setOpen(false);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected?.nome ?? placeholder}
            </span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nome, telefone ou CNPJ..."
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
                  <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                  <CommandGroup>
                    {items.map((fornecedor) => (
                      <CommandItem
                        key={fornecedor.id}
                        value={fornecedor.id}
                        onSelect={() => handleSelect(fornecedor)}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 size-4",
                            selected?.id === fornecedor.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{fornecedor.nome}</span>
                          {fornecedor.telefone ? (
                            <span className="text-xs text-muted-foreground">
                              {fornecedor.telefone}
                            </span>
                          ) : null}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="__create"
                  onSelect={() => {
                    setOpen(false);
                    setCreating(true);
                  }}
                >
                  <PlusIcon className="mr-2 size-4" />
                  Criar novo fornecedor
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo fornecedor</DialogTitle>
          </DialogHeader>
          <FornecedorForm
            onSuccess={(fornecedor) => {
              setCreating(false);
              handleSelect(fornecedor);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
