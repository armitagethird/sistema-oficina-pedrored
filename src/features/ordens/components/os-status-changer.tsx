"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mudarStatus } from "../actions";
import { getNextStatuses, STATUS_LABEL, type OSStatus } from "../types";

type OsStatusChangerProps = {
  osId: string;
  currentStatus: OSStatus;
  kmEntrada?: number | null;
};

export function OsStatusChanger({
  osId,
  currentStatus,
  kmEntrada,
}: OsStatusChangerProps) {
  const nextStatuses = getNextStatuses(currentStatus);
  const [pending, startTransition] = React.useTransition();
  const [askKm, setAskKm] = React.useState<OSStatus | null>(null);
  const [kmSaida, setKmSaida] = React.useState<string>("");

  if (nextStatuses.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Sem transições disponíveis.
      </span>
    );
  }

  async function performChange(newStatus: OSStatus, km?: number) {
    startTransition(async () => {
      const result = await mudarStatus(osId, newStatus, km != null ? { km_saida: km } : {});
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Status: ${STATUS_LABEL[newStatus]}`);
    });
  }

  function handleSelect(newStatus: OSStatus) {
    if (newStatus === "entregue") {
      setKmSaida(kmEntrada ? String(kmEntrada) : "");
      setAskKm(newStatus);
      return;
    }
    performChange(newStatus);
  }

  function confirmKm() {
    if (!askKm) return;
    const km = Number(kmSaida);
    if (!Number.isFinite(km) || km < 0) {
      toast.error("KM inválida");
      return;
    }
    performChange(askKm, km);
    setAskKm(null);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" disabled={pending}>
            Avançar status
            <ChevronDownIcon className="ml-1 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {nextStatuses.map((s) => (
            <DropdownMenuItem key={s} onSelect={() => handleSelect(s)}>
              {STATUS_LABEL[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={askKm === "entregue"} onOpenChange={(o) => !o && setAskKm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quilometragem de saída</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="km_saida">KM ao entregar</Label>
            <Input
              id="km_saida"
              type="number"
              inputMode="numeric"
              value={kmSaida}
              onChange={(e) => setKmSaida(e.target.value)}
              placeholder={kmEntrada ? String(kmEntrada) : "0"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskKm(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmKm} disabled={pending}>
              {pending ? "Salvando..." : "Confirmar entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
