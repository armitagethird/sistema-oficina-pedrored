"use client";

import * as React from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemizedList } from "@/shared/components/itemized-list";
import { MoneyInput } from "@/shared/components/money-input";
import { formatBRL } from "@/shared/format/money";
import { addServico, removeServico, updateServico } from "../actions";
import type { OsServico } from "../types";

type Draft = {
  id: string | null;
  descricao: string;
  valor_unitario: string;
  quantidade: string;
};

function toDraft(s: OsServico): Draft {
  return {
    id: s.id,
    descricao: s.descricao,
    valor_unitario: Number(s.valor_unitario).toFixed(2),
    quantidade: String(s.quantidade),
  };
}

export function OsServicosItemized({
  osId,
  servicos,
}: {
  osId: string;
  servicos: OsServico[];
}) {
  const [items, setItems] = React.useState<Draft[]>(servicos.map(toDraft));
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setItems(servicos.map(toDraft));
  }, [servicos]);

  function update(index: number, patch: Partial<Draft>) {
    setItems((curr) =>
      curr.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  }

  function persist(index: number) {
    const draft = items[index];
    if (!draft) return;
    const valor = Number(draft.valor_unitario);
    const qtd = Number(draft.quantidade);
    if (!draft.descricao.trim() || !Number.isFinite(valor) || valor < 0) return;
    if (!Number.isFinite(qtd) || qtd <= 0) return;

    startTransition(async () => {
      if (draft.id) {
        const r = await updateServico(draft.id, {
          descricao: draft.descricao,
          valor_unitario: valor,
          quantidade: qtd,
        });
        if (!r.ok) toast.error(r.error);
      } else {
        const r = await addServico(osId, {
          descricao: draft.descricao,
          valor_unitario: valor,
          quantidade: qtd,
        });
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        update(index, { id: r.data.id });
      }
    });
  }

  function handleAdd() {
    setItems((curr) => [
      ...curr,
      { id: null, descricao: "", valor_unitario: "0.00", quantidade: "1" },
    ]);
  }

  function handleRemove(index: number) {
    const draft = items[index];
    if (!draft) return;
    if (!draft.id) {
      setItems((curr) => curr.filter((_, i) => i !== index));
      return;
    }
    startTransition(async () => {
      const r = await removeServico(draft.id!);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setItems((curr) => curr.filter((_, i) => i !== index));
    });
  }

  const total = items.reduce((acc, it) => {
    const v = Number(it.valor_unitario);
    const q = Number(it.quantidade);
    if (!Number.isFinite(v) || !Number.isFinite(q)) return acc;
    return acc + v * q;
  }, 0);

  return (
    <div className="flex flex-col gap-3">
      <ItemizedList
        items={items}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel="Adicionar serviço"
        emptyLabel="Nenhum serviço lançado."
        renderItem={(item, index) => (
          <div className="grid gap-2 md:grid-cols-[1fr_120px_80px]">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`servico-${index}-descricao`}
                className="text-xs text-muted-foreground"
              >
                Descrição
              </Label>
              <Input
                id={`servico-${index}-descricao`}
                value={item.descricao}
                onChange={(e) => update(index, { descricao: e.target.value })}
                onBlur={() => persist(index)}
                placeholder="Ex: Troca de óleo"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Valor unitário</Label>
              <MoneyInput
                value={item.valor_unitario}
                onValueChange={(v) => {
                  update(index, { valor_unitario: v });
                  persist(index);
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`servico-${index}-qtd`}
                className="text-xs text-muted-foreground"
              >
                Qtd
              </Label>
              <Input
                id={`servico-${index}-qtd`}
                type="number"
                inputMode="decimal"
                min={0.01}
                step={0.5}
                value={item.quantidade}
                onChange={(e) => update(index, { quantidade: e.target.value })}
                onBlur={() => persist(index)}
              />
            </div>
          </div>
        )}
      />
      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Total serviços</span>
        <span className="font-medium">{formatBRL(total)}</span>
      </div>
      {pending ? (
        <p className="text-xs text-muted-foreground">Salvando...</p>
      ) : null}
    </div>
  );
}
