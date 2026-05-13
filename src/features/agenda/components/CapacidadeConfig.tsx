"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsCapacidade } from "../actions";

interface Props {
  capacidadeManha: number;
  capacidadeTarde: number;
}

export function CapacidadeConfig({ capacidadeManha, capacidadeTarde }: Props) {
  const [manha, setManha] = useState(String(capacidadeManha));
  const [tarde, setTarde] = useState(String(capacidadeTarde));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSettingsCapacidade({
        capacidade_manha: parseInt(manha, 10),
        capacidade_tarde: parseInt(tarde, 10),
      });
      if (result.ok) {
        toast.success("Capacidade salva");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cap-manha">Capacidade Manhã</Label>
          <Input
            id="cap-manha"
            type="number"
            min={0}
            max={20}
            value={manha}
            onChange={(e) => setManha(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cap-tarde">Capacidade Tarde</Label>
          <Input
            id="cap-tarde"
            type="number"
            min={0}
            max={20}
            value={tarde}
            onChange={(e) => setTarde(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
