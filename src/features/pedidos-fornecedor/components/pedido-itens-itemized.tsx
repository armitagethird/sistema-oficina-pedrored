"use client";

import * as React from "react";
import { LinkIcon, Unlink2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemizedList } from "@/shared/components/itemized-list";
import { MoneyInput } from "@/shared/components/money-input";
import { formatBRL } from "@/shared/format/money";
import { addPedidoItem, removePedidoItem, updatePedidoItem } from "../actions";
import type { PedidoItem } from "../types";
import { VincularOsPecaModal } from "./vincular-os-peca-modal";

type Draft = {
  id: string | null;
  descricao: string;
  custo_unitario: string;
  quantidade: string;
  os_peca_id: string | null;
};

function toDraft(item: PedidoItem): Draft {
  return {
    id: item.id,
    descricao: item.descricao,
    custo_unitario: Number(item.custo_unitario).toFixed(2),
    quantidade: String(item.quantidade),
    os_peca_id: item.os_peca_id,
  };
}

export function PedidoItensItemized({
  pedidoId,
  itens,
  readonly = false,
}: {
  pedidoId: string;
  itens: PedidoItem[];
  readonly?: boolean;
}) {
  const [items, setItems] = React.useState<Draft[]>(itens.map(toDraft));
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setItems(itens.map(toDraft));
  }, [itens]);

  function update(index: number, patch: Partial<Draft>) {
    setItems((curr) =>
      curr.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  }

  function persist(index: number) {
    if (readonly) return;
    const draft = items[index];
    if (!draft) return;
    const custo = Number(draft.custo_unitario);
    const qtd = Number(draft.quantidade);
    if (!draft.descricao.trim()) return;
    if (!Number.isFinite(custo) || custo < 0) return;
    if (!Number.isFinite(qtd) || qtd <= 0) return;

    const payload = {
      descricao: draft.descricao,
      custo_unitario: custo,
      quantidade: qtd,
    };

    startTransition(async () => {
      if (draft.id) {
        const r = await updatePedidoItem(draft.id, payload);
        if (!r.ok) toast.error(r.error);
      } else {
        const r = await addPedidoItem(pedidoId, payload);
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
      {
        id: null,
        descricao: "",
        custo_unitario: "0.00",
        quantidade: "1",
        os_peca_id: null,
      },
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
      const r = await removePedidoItem(draft.id!);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setItems((curr) => curr.filter((_, i) => i !== index));
    });
  }

  const total = items.reduce((acc, it) => {
    const c = Number(it.custo_unitario);
    const q = Number(it.quantidade);
    if (!Number.isFinite(c) || !Number.isFinite(q)) return acc;
    return acc + c * q;
  }, 0);

  if (readonly) {
    return (
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item lançado.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item, index) => {
              const subtotal = Number(item.custo_unitario) * Number(item.quantidade);
              return (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBRL(Number(item.custo_unitario))} × {item.quantidade}
                      {item.os_peca_id ? " · vinculado a peça de OS" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">{formatBRL(subtotal)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Valor total</span>
          <span className="font-medium">{formatBRL(total)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ItemizedList
        items={items}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel="Adicionar item"
        emptyLabel="Nenhum item lançado."
        renderItem={(item, index) => (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`item-${index}-descricao`}
                className="text-xs text-muted-foreground"
              >
                Descrição
              </Label>
              <Input
                id={`item-${index}-descricao`}
                value={item.descricao}
                onChange={(e) => update(index, { descricao: e.target.value })}
                onBlur={() => persist(index)}
                placeholder="Ex: Filtro de ar MANN C25114"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Custo unit.</Label>
                <MoneyInput
                  value={item.custo_unitario}
                  onValueChange={(v) => {
                    update(index, { custo_unitario: v });
                    persist(index);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`item-${index}-qtd`}
                  className="text-xs text-muted-foreground"
                >
                  Qtd
                </Label>
                <Input
                  id={`item-${index}-qtd`}
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  step={1}
                  value={item.quantidade}
                  onChange={(e) => update(index, { quantidade: e.target.value })}
                  onBlur={() => persist(index)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Subtotal</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium">
                  {formatBRL(Number(item.custo_unitario) * Number(item.quantidade))}
                </div>
              </div>
            </div>

            {item.id ? (
              <div className="flex items-center gap-2">
                {item.os_peca_id ? (
                  <Badge variant="secondary" className="gap-1">
                    <LinkIcon className="size-3" />
                    Vinculado à peça da OS
                  </Badge>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Unlink2Icon className="size-3" />
                    Sem vínculo de OS
                  </span>
                )}
                <VincularOsPecaModal
                  itemId={item.id}
                  currentOsPecaId={item.os_peca_id}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Salve o item primeiro para poder vincular a uma peça de OS.
              </p>
            )}
          </div>
        )}
      />
      <div className="flex justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Valor total</span>
        <span className="font-medium">{formatBRL(total)}</span>
      </div>
      {pending ? (
        <p className="text-xs text-muted-foreground">Salvando...</p>
      ) : null}
    </div>
  );
}
