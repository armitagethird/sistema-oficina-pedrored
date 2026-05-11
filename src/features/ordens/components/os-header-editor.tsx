"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOSHeader } from "../actions";
import type { OSDetalhe } from "../queries";

const isReadOnly = (status: OSDetalhe["status"]) =>
  status === "entregue" || status === "cancelada";

export function OsHeaderEditor({ os }: { os: OSDetalhe }) {
  const [descricao, setDescricao] = React.useState(os.descricao_problema);
  const [observacoes, setObservacoes] = React.useState(os.observacoes ?? "");
  const [kmEntrada, setKmEntrada] = React.useState<string>(
    os.km_entrada != null ? String(os.km_entrada) : "",
  );
  const [pending, startTransition] = React.useTransition();
  const readOnly = isReadOnly(os.status);

  React.useEffect(() => {
    setDescricao(os.descricao_problema);
    setObservacoes(os.observacoes ?? "");
    setKmEntrada(os.km_entrada != null ? String(os.km_entrada) : "");
  }, [os.descricao_problema, os.observacoes, os.km_entrada]);

  function save() {
    if (readOnly) return;
    startTransition(async () => {
      const r = await updateOSHeader(os.id, {
        descricao_problema: descricao,
        observacoes,
        km_entrada: kmEntrada ? Number(kmEntrada) : null,
      });
      if (!r.ok) toast.error(r.error);
      else toast.success("Atualizado");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="problema">Problema relatado</Label>
        <Textarea
          id="problema"
          rows={3}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          disabled={readOnly}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="km_entrada">KM de entrada</Label>
          <Input
            id="km_entrada"
            type="number"
            inputMode="numeric"
            value={kmEntrada}
            onChange={(e) => setKmEntrada(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="km_saida">KM de saída</Label>
          <Input
            id="km_saida"
            type="number"
            inputMode="numeric"
            value={os.km_saida ?? ""}
            disabled
            placeholder="Preenchido na entrega"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          rows={2}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          disabled={readOnly}
        />
      </div>
      {readOnly ? (
        <p className="text-xs text-muted-foreground">
          OS finalizada não pode ser editada.
        </p>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={save}
          disabled={pending}
          className="self-start"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      )}
    </div>
  );
}
