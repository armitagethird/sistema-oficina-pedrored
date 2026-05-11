"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "@/shared/components/money-input";
import { formatBRL } from "@/shared/format/money";
import { criarParcelasFromOS } from "../actions";
import {
  PAGAMENTO_METODO_LABEL,
  PAGAMENTO_METODO_VALUES,
  type PagamentoMetodo,
} from "../types";

type Linha = {
  valor: string;
  metodo: PagamentoMetodo;
  data_prevista: string;
};

function makeLinha(initialValor = "0.00"): Linha {
  return { valor: initialValor, metodo: "pix", data_prevista: "" };
}

type CriarParcelasDialogProps = {
  osId: string;
  totalGeral: number;
  trigger?: React.ReactNode;
  onCreated?: () => void;
};

export function CriarParcelasDialog({
  osId,
  totalGeral,
  trigger,
  onCreated,
}: CriarParcelasDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [linhas, setLinhas] = React.useState<Linha[]>([makeLinha(totalGeral.toFixed(2))]);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setLinhas([makeLinha(totalGeral.toFixed(2))]);
    }
  }, [open, totalGeral]);

  function update(i: number, patch: Partial<Linha>) {
    setLinhas((curr) => curr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function adicionarLinha() {
    setLinhas((curr) => [...curr, makeLinha("0.00")]);
  }

  function removerLinha(i: number) {
    setLinhas((curr) => curr.filter((_, idx) => idx !== i));
  }

  function dividirEmIguais(n: number) {
    if (n <= 0) return;
    const valor = Number((totalGeral / n).toFixed(2));
    setLinhas(() => Array.from({ length: n }, () => makeLinha(valor.toFixed(2))));
  }

  const somaParcelas = linhas.reduce((acc, l) => acc + (Number(l.valor) || 0), 0);
  const diff = somaParcelas - totalGeral;

  function handleSubmit() {
    const parcelas = linhas
      .map((l) => ({
        valor: Number(l.valor),
        metodo: l.metodo,
        data_prevista: l.data_prevista || null,
      }))
      .filter((p) => p.valor > 0);
    if (parcelas.length === 0) {
      toast.error("Adicione ao menos uma parcela com valor maior que zero.");
      return;
    }
    startTransition(async () => {
      const result = await criarParcelasFromOS({ os_id: osId, parcelas });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.length} parcela${result.data.length === 1 ? "" : "s"} criada${result.data.length === 1 ? "" : "s"}`);
      setOpen(false);
      onCreated?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <PlusIcon className="mr-1 size-4" />
            Criar parcelas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar parcelas</DialogTitle>
          <DialogDescription>
            Total da OS: <span className="font-medium">{formatBRL(totalGeral)}</span>.
            A soma das parcelas pode diferir do total (descontos/abatimentos são
            permitidos).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Atalhos:</span>
          <button
            type="button"
            onClick={() => dividirEmIguais(2)}
            className="rounded-md border px-2 py-0.5 text-xs hover:bg-accent"
          >
            Dividir em 2x
          </button>
          <button
            type="button"
            onClick={() => dividirEmIguais(3)}
            className="rounded-md border px-2 py-0.5 text-xs hover:bg-accent"
          >
            Dividir em 3x
          </button>
          <button
            type="button"
            onClick={() => dividirEmIguais(4)}
            className="rounded-md border px-2 py-0.5 text-xs hover:bg-accent"
          >
            Dividir em 4x
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {linhas.map((l, i) => (
            <li
              key={i}
              className="grid items-end gap-2 rounded-md border bg-card p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Valor</Label>
                <MoneyInput
                  value={l.valor}
                  onValueChange={(v) => update(i, { valor: v })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Método</Label>
                <Select
                  value={l.metodo}
                  onValueChange={(v) => update(i, { metodo: v as PagamentoMetodo })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGAMENTO_METODO_VALUES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAGAMENTO_METODO_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Data prevista</Label>
                <Input
                  type="date"
                  value={l.data_prevista}
                  onChange={(e) => update(i, { data_prevista: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removerLinha(i)}
                disabled={linhas.length === 1}
                aria-label="Remover parcela"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarLinha}
          className="self-start"
        >
          <PlusIcon className="mr-1 size-4" />
          Adicionar parcela
        </Button>

        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Soma das parcelas: {formatBRL(somaParcelas)}
          </span>
          {Math.abs(diff) > 0.005 ? (
            <span
              className={
                diff > 0
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-blue-700 dark:text-blue-300"
              }
            >
              {diff > 0 ? "Acima" : "Abaixo"} do total: {formatBRL(Math.abs(diff))}
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-300">
              Bate com o total
            </span>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? "Criando..." : "Criar parcelas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
