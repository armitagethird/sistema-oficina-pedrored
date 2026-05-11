"use client";

import * as React from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemizedList } from "@/shared/components/itemized-list";
import { MoneyInput } from "@/shared/components/money-input";
import { formatBRL } from "@/shared/format/money";
import { addPeca, removePeca, updatePeca } from "../actions";
import {
  PECA_ORIGEM_LABEL,
  PECA_ORIGEM_VALUES,
  PECA_STATUS_LABEL,
  PECA_STATUS_VALUES,
  type OsPeca,
  type PecaOrigem,
  type PecaStatus,
} from "../types";

type Draft = {
  id: string | null;
  descricao: string;
  origem: PecaOrigem;
  custo_unitario: string;
  preco_venda_unitario: string;
  quantidade: string;
  link_ml: string;
  fornecedor_nome: string;
  status: PecaStatus;
};

function toDraft(p: OsPeca): Draft {
  return {
    id: p.id,
    descricao: p.descricao,
    origem: p.origem,
    custo_unitario: Number(p.custo_unitario).toFixed(2),
    preco_venda_unitario: Number(p.preco_venda_unitario).toFixed(2),
    quantidade: String(p.quantidade),
    link_ml: p.link_ml ?? "",
    fornecedor_nome: p.fornecedor_nome ?? "",
    status: p.status,
  };
}

export function OsPecasItemized({
  osId,
  pecas,
}: {
  osId: string;
  pecas: OsPeca[];
}) {
  const [items, setItems] = React.useState<Draft[]>(pecas.map(toDraft));
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setItems(pecas.map(toDraft));
  }, [pecas]);

  function update(index: number, patch: Partial<Draft>) {
    setItems((curr) =>
      curr.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  }

  function persist(index: number) {
    const draft = items[index];
    if (!draft) return;
    const custo = Number(draft.custo_unitario);
    const preco = Number(draft.preco_venda_unitario);
    const qtd = Number(draft.quantidade);
    if (!draft.descricao.trim()) return;
    if (!Number.isFinite(custo) || custo < 0) return;
    if (!Number.isFinite(preco) || preco < 0) return;
    if (!Number.isFinite(qtd) || qtd <= 0) return;

    const payload = {
      descricao: draft.descricao,
      origem: draft.origem,
      custo_unitario: custo,
      preco_venda_unitario: preco,
      quantidade: qtd,
      link_ml: draft.link_ml,
      fornecedor_nome: draft.fornecedor_nome,
      status: draft.status,
    };

    startTransition(async () => {
      if (draft.id) {
        const r = await updatePeca(draft.id, payload);
        if (!r.ok) toast.error(r.error);
      } else {
        const r = await addPeca(osId, payload);
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
        origem: "fornecedor",
        custo_unitario: "0.00",
        preco_venda_unitario: "0.00",
        quantidade: "1",
        link_ml: "",
        fornecedor_nome: "",
        status: "pendente",
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
      const r = await removePeca(draft.id!);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setItems((curr) => curr.filter((_, i) => i !== index));
    });
  }

  const totalVenda = items.reduce((acc, it) => {
    const v = Number(it.preco_venda_unitario);
    const q = Number(it.quantidade);
    if (!Number.isFinite(v) || !Number.isFinite(q)) return acc;
    return acc + v * q;
  }, 0);

  const totalCusto = items.reduce((acc, it) => {
    const v = Number(it.custo_unitario);
    const q = Number(it.quantidade);
    if (!Number.isFinite(v) || !Number.isFinite(q)) return acc;
    return acc + v * q;
  }, 0);

  const margem = totalVenda - totalCusto;

  return (
    <div className="flex flex-col gap-3">
      <ItemizedList
        items={items}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel="Adicionar peça"
        emptyLabel="Nenhuma peça lançada."
        renderItem={(item, index) => (
          <div className="flex flex-col gap-2">
            <div className="grid gap-2 md:grid-cols-[1fr_160px]">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`peca-${index}-descricao`}
                  className="text-xs text-muted-foreground"
                >
                  Descrição
                </Label>
                <Input
                  id={`peca-${index}-descricao`}
                  value={item.descricao}
                  onChange={(e) => update(index, { descricao: e.target.value })}
                  onBlur={() => persist(index)}
                  placeholder="Ex: Filtro de óleo MANN"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Origem</Label>
                <Select
                  value={item.origem}
                  onValueChange={(v) => {
                    update(index, { origem: v as PecaOrigem });
                    persist(index);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PECA_ORIGEM_VALUES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {PECA_ORIGEM_LABEL[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
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
                <Label className="text-xs text-muted-foreground">Venda unit.</Label>
                <MoneyInput
                  value={item.preco_venda_unitario}
                  onValueChange={(v) => {
                    update(index, { preco_venda_unitario: v });
                    persist(index);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`peca-${index}-qtd`}
                  className="text-xs text-muted-foreground"
                >
                  Qtd
                </Label>
                <Input
                  id={`peca-${index}-qtd`}
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
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={item.status}
                  onValueChange={(v) => {
                    update(index, { status: v as PecaStatus });
                    persist(index);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PECA_STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PECA_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`peca-${index}-fornecedor`}
                  className="text-xs text-muted-foreground"
                >
                  Fornecedor
                </Label>
                <Input
                  id={`peca-${index}-fornecedor`}
                  value={item.fornecedor_nome}
                  onChange={(e) =>
                    update(index, { fornecedor_nome: e.target.value })
                  }
                  onBlur={() => persist(index)}
                  placeholder="Nome do fornecedor"
                />
              </div>
              {item.origem === "mercado_livre_afiliado" ? (
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor={`peca-${index}-link`}
                    className="text-xs text-muted-foreground"
                  >
                    Link Mercado Livre
                  </Label>
                  <Input
                    id={`peca-${index}-link`}
                    type="url"
                    value={item.link_ml}
                    onChange={(e) => update(index, { link_ml: e.target.value })}
                    onBlur={() => persist(index)}
                    placeholder="https://produto.mercadolivre.com.br/..."
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}
      />
      <div className="grid gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm sm:grid-cols-3">
        <div className="flex justify-between sm:flex-col">
          <span className="text-muted-foreground">Custo total</span>
          <span className="font-medium">{formatBRL(totalCusto)}</span>
        </div>
        <div className="flex justify-between sm:flex-col">
          <span className="text-muted-foreground">Venda total</span>
          <span className="font-medium">{formatBRL(totalVenda)}</span>
        </div>
        <div className="flex justify-between sm:flex-col">
          <span className="text-muted-foreground">Margem</span>
          <span className="font-medium">{formatBRL(margem)}</span>
        </div>
      </div>
      {pending ? (
        <p className="text-xs text-muted-foreground">Salvando...</p>
      ) : null}
    </div>
  );
}
