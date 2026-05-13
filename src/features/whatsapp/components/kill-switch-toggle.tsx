"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { togglePausaEnvios } from "../actions";

interface Props {
  defaultAtivo: boolean;
}

export function KillSwitchToggle({ defaultAtivo }: Props) {
  const [pending, start] = useTransition();

  function handleChange(value: boolean) {
    start(async () => {
      const result = await togglePausaEnvios(value);
      if (!result.ok) {
        toast.error(result.error ?? "Erro ao atualizar");
        return;
      }
      toast.success(value ? "Envios ativados" : "Envios pausados");
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-4">
      <div className="flex-1">
        <Label
          htmlFor="kill-switch"
          className="cursor-pointer text-sm font-medium"
        >
          Envios automáticos
        </Label>
        <p className="text-xs text-muted-foreground">
          Pausa todos os envios — crons e mensagens manuais ficam bloqueados
          enquanto desligado.
        </p>
      </div>
      <Switch
        id="kill-switch"
        defaultChecked={defaultAtivo}
        disabled={pending}
        onCheckedChange={handleChange}
      />
    </div>
  );
}
