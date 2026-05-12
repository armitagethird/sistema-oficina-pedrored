"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";

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

type OsOption = {
  id: string;
  numero: number;
  cliente_nome: string | null;
  veiculo_placa: string | null;
};

type OsComboboxProps = {
  value?: string | null;
  onSelect: (osId: string | null) => void;
  placeholder?: string;
  allowNone?: boolean;
};

export function OsCombobox({
  value,
  onSelect,
  placeholder = "Vincular a OS (opcional)",
  allowNone = true,
}: OsComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<OsOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<OsOption | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("ordens_servico")
      .select(
        "id, numero, cliente:clientes(nome), veiculo:veiculos(placa)",
      )
      .is("deletado_em", null)
      .not("status", "in", "(entregue,cancelada)")
      .order("criado_em", { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          type Row = {
            id: string;
            numero: number;
            cliente: { nome: string } | null;
            veiculo: { placa: string | null } | null;
          };
          setItems(
            (data as unknown as Row[]).map((row) => ({
              id: row.id,
              numero: row.numero,
              cliente_nome: row.cliente?.nome ?? null,
              veiculo_placa: row.veiculo?.placa ?? null,
            })),
          );
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    const local = items.find((o) => o.id === value);
    if (local) {
      setSelected(local);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("ordens_servico")
      .select("id, numero, cliente:clientes(nome), veiculo:veiculos(placa)")
      .eq("id", value)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        type Row = {
          id: string;
          numero: number;
          cliente: { nome: string } | null;
          veiculo: { placa: string | null } | null;
        };
        const row = data as unknown as Row;
        setSelected({
          id: row.id,
          numero: row.numero,
          cliente_nome: row.cliente?.nome ?? null,
          veiculo_placa: row.veiculo?.placa ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [value, items]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((o) => {
      const num = `#${o.numero}`;
      return (
        num.includes(term) ||
        o.cliente_nome?.toLowerCase().includes(term) ||
        o.veiculo_placa?.toLowerCase().includes(term)
      );
    });
  }, [items, search]);

  function label(opt: OsOption) {
    const parts = [`#${opt.numero}`];
    if (opt.cliente_nome) parts.push(opt.cliente_nome);
    if (opt.veiculo_placa) parts.push(opt.veiculo_placa);
    return parts.join(" · ");
  }

  return (
    <div className="flex items-center gap-2">
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
              {selected ? label(selected) : placeholder}
            </span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por OS, cliente ou placa..."
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
                  <CommandEmpty>Nenhuma OS ativa encontrada.</CommandEmpty>
                  <CommandGroup>
                    {filtered.map((opt) => (
                      <CommandItem
                        key={opt.id}
                        value={opt.id}
                        onSelect={() => {
                          setSelected(opt);
                          onSelect(opt.id);
                          setOpen(false);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 size-4",
                            selected?.id === opt.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {label(opt)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {allowNone && selected ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelected(null);
            onSelect(null);
          }}
          aria-label="Desvincular OS"
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
