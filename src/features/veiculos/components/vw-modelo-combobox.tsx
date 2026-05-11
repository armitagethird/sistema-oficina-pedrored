"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

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
import type { VwModelo } from "../types";

type VwModeloComboboxProps = {
  value?: string | null;
  onSelect: (modelo: VwModelo | null) => void;
  onCustomFallback?: () => void;
};

export function VwModeloCombobox({
  value,
  onSelect,
  onCustomFallback,
}: VwModeloComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<VwModelo[]>([]);
  const [selected, setSelected] = React.useState<VwModelo | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    const term = search.trim();
    let query = supabase
      .from("vw_modelos")
      .select("*")
      .order("modelo", { ascending: true })
      .order("motor", { ascending: true })
      .limit(40);
    if (term) {
      const w = `%${term}%`;
      query = query.or(`modelo.ilike.${w},motor.ilike.${w}`);
    }
    query.then(({ data, error }) => {
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
    const local = items.find((m) => m.id === value);
    if (local) {
      setSelected(local);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("vw_modelos")
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

  function handleSelect(modelo: VwModelo) {
    setSelected(modelo);
    onSelect(modelo);
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
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected
              ? `${selected.modelo} ${selected.motor}`
              : "Selecione o modelo VW"}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar modelo ou motor..."
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
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 px-3 py-2 text-sm">
                    <p>Nenhum modelo encontrado.</p>
                    {onCustomFallback ? (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setOpen(false);
                          onCustomFallback();
                        }}
                      >
                        Inserir manualmente
                      </Button>
                    ) : null}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {items.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={m.id}
                      onSelect={() => handleSelect(m)}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 size-4",
                          selected?.id === m.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span>
                          {m.modelo} {m.motor}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.combustivel}
                          {m.ano_inicio
                            ? ` · ${m.ano_inicio}${m.ano_fim ? `–${m.ano_fim}` : "+"}`
                            : ""}
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
