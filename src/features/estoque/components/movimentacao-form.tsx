"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/shared/components/money-input";
import {
  registrarAjuste,
  registrarEntrada,
  registrarSaida,
} from "../actions";
import {
  MOVIMENTACAO_TIPO_LABEL,
  type MovimentacaoTipo,
} from "../types";
import { ItemCombobox, type ItemComboboxValue } from "./item-combobox";

const TIPOS_DISPONIVEIS: { value: "entrada" | "saida_loja" | "ajuste"; label: string }[] = [
  { value: "entrada", label: MOVIMENTACAO_TIPO_LABEL.entrada },
  { value: "saida_loja", label: "Saída avulsa" },
  { value: "ajuste", label: MOVIMENTACAO_TIPO_LABEL.ajuste },
];

export function MovimentacaoForm({
  defaultItemId,
}: {
  defaultItemId?: string;
}) {
  const router = useRouter();
  const [tipo, setTipo] = React.useState<"entrada" | "saida_loja" | "ajuste">(
    "entrada",
  );
  const [item, setItem] = React.useState<ItemComboboxValue | null>(null);
  const [quantidade, setQuantidade] = React.useState("1");
  const [custoUnitario, setCustoUnitario] = React.useState("0.00");
  const [motivo, setMotivo] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) {
      toast.error("Selecione um item");
      return;
    }
    const qtd = Number(quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      toast.error("Quantidade inválida");
      return;
    }
    setSubmitting(true);
    let result;
    if (tipo === "entrada") {
      const custo = Number(custoUnitario);
      if (!Number.isFinite(custo) || custo < 0) {
        toast.error("Custo inválido");
        setSubmitting(false);
        return;
      }
      result = await registrarEntrada({
        item_id: item.id,
        quantidade: qtd,
        custo_unitario: custo,
      });
    } else if (tipo === "saida_loja") {
      result = await registrarSaida({
        item_id: item.id,
        quantidade: qtd,
        motivo: motivo || null,
      });
    } else {
      if (!motivo.trim()) {
        toast.error("Motivo obrigatório no ajuste");
        setSubmitting(false);
        return;
      }
      result = await registrarAjuste({
        item_id: item.id,
        quantidade: qtd,
        motivo,
      });
    }
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Movimentação registrada");
    router.push(`/app/estoque/${item.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Tipo de movimentação</Label>
        <Select
          value={tipo}
          onValueChange={(v) => setTipo(v as MovimentacaoTipo as "entrada" | "saida_loja" | "ajuste")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_DISPONIVEIS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Item</Label>
        <ItemCombobox
          value={defaultItemId ?? item?.id ?? null}
          onSelect={(it) => setItem(it)}
        />
        {item ? (
          <p className="text-xs text-muted-foreground">
            Em estoque: {Number(item.quantidade_atual)} {item.unidade}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Quantidade</Label>
          <Input
            type="number"
            inputMode="decimal"
            min={0.001}
            step="0.001"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </div>
        {tipo === "entrada" ? (
          <div className="flex flex-col gap-2">
            <Label>Custo unitário</Label>
            <MoneyInput
              value={custoUnitario}
              onValueChange={setCustoUnitario}
            />
          </div>
        ) : null}
      </div>

      {tipo === "ajuste" || tipo === "saida_loja" ? (
        <div className="flex flex-col gap-2">
          <Label>
            Motivo {tipo === "ajuste" ? "*" : "(opcional)"}
          </Label>
          <Textarea
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={
              tipo === "ajuste"
                ? "Ex: correção de inventário"
                : "Ex: peça doada / amostra"
            }
          />
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Registrando..." : "Registrar movimentação"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
