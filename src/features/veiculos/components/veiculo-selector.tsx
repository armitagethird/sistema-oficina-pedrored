"use client";

import * as React from "react";
import { CarIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { VeiculoForm } from "./veiculo-form";
import { descreveVeiculo, type Veiculo, type VeiculoComModelo } from "../types";

type VeiculoSelectorProps = {
  clienteId: string;
  value?: string | null;
  onSelect: (veiculo: Veiculo) => void;
};

export function VeiculoSelector({
  clienteId,
  value,
  onSelect,
}: VeiculoSelectorProps) {
  const [veiculos, setVeiculos] = React.useState<VeiculoComModelo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("veiculos")
      .select("*, vw_modelo:vw_modelos(modelo, motor, combustivel)")
      .eq("cliente_id", clienteId)
      .is("deletado_em", null)
      .order("criado_em", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setVeiculos(data as VeiculoComModelo[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId, refreshKey]);

  return (
    <div className="flex flex-col gap-2">
      {loading ? (
        <div className="rounded-md border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
          Carregando veículos...
        </div>
      ) : veiculos.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm">
          <CarIcon className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <p className="mt-2 text-muted-foreground">
            Cliente ainda não tem veículo cadastrado.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {veiculos.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onSelect(v)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent",
                  value === v.id && "border-primary bg-accent",
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{descreveVeiculo(v)}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.km_atual?.toLocaleString("pt-BR") ?? 0} km
                    {v.cor ? ` • ${v.cor}` : ""}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setCreating(true)}
        className="self-start"
      >
        <PlusIcon className="mr-1 size-4" />
        Novo veículo
      </Button>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo veículo</DialogTitle>
          </DialogHeader>
          <VeiculoForm
            clienteId={clienteId}
            onSuccess={(v) => {
              setCreating(false);
              setRefreshKey((k) => k + 1);
              onSelect(v);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
