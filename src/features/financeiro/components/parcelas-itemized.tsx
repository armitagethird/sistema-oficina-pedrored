"use client";

import * as React from "react";
import { CheckCircle2Icon, PencilIcon, RotateCcwIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/shared/format/money";
import {
  cancelarPagamento,
  deletePagamento,
  marcarPago,
  reabrirPagamento,
} from "../actions";
import { PAGAMENTO_METODO_LABEL, type Pagamento } from "../types";
import { CriarParcelasDialog } from "./criar-parcelas-dialog";
import { ParcelaForm } from "./parcela-form";
import { ParcelaStatusBadge } from "./parcela-status-badge";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

function formatDataPaga(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

type Action = "marcarPago" | "reabrir" | "cancelar" | "excluir";

export function ParcelasItemized({
  osId,
  totalGeral,
  pagamentos,
}: {
  osId: string;
  totalGeral: number;
  pagamentos: Pagamento[];
}) {
  const [editing, setEditing] = React.useState<Pagamento | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const totals = React.useMemo(() => {
    let pago = 0;
    let pendente = 0;
    let atrasado = 0;
    let cancelado = 0;
    for (const p of pagamentos) {
      const v = Number(p.valor);
      if (p.status === "pago") pago += v;
      else if (p.status === "pendente") pendente += v;
      else if (p.status === "atrasado") atrasado += v;
      else if (p.status === "cancelado") cancelado += v;
    }
    return { pago, pendente, atrasado, cancelado };
  }, [pagamentos]);

  const progresso = totalGeral > 0 ? Math.min(100, (totals.pago / totalGeral) * 100) : 0;

  function executar(id: string, action: Action) {
    startTransition(async () => {
      let result;
      if (action === "marcarPago") result = await marcarPago(id);
      else if (action === "reabrir") result = await reabrirPagamento(id);
      else if (action === "cancelar") result = await cancelarPagamento(id);
      else result = await deletePagamento(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const labels = {
        marcarPago: "Marcado como pago",
        reabrir: "Parcela reaberta",
        cancelar: "Parcela cancelada",
        excluir: "Parcela excluída",
      };
      toast.success(labels[action]);
    });
  }

  const ordemSugerida = (pagamentos[pagamentos.length - 1]?.ordem ?? 0) + 1;
  const ativas = pagamentos.filter((p) => p.status !== "cancelado");
  const canceladas = pagamentos.filter((p) => p.status === "cancelado");

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border bg-muted/30 p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm">
            <span className="font-medium">{formatBRL(totals.pago)}</span>{" "}
            <span className="text-muted-foreground">de {formatBRL(totalGeral)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {totalGeral > 0
              ? `${progresso.toFixed(0)}% pago`
              : "Adicione serviços/peças para gerar total"}
          </p>
        </div>
        <Progress value={progresso} className="mt-2 h-2" />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Pendente: {formatBRL(totals.pendente)}</span>
          {totals.atrasado > 0 ? (
            <span className="text-red-700 dark:text-red-300">
              Atrasado: {formatBRL(totals.atrasado)}
            </span>
          ) : null}
          {totals.cancelado > 0 ? <span>Cancelado: {formatBRL(totals.cancelado)}</span> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {pagamentos.length === 0 && totalGeral > 0 ? (
          <CriarParcelasDialog osId={osId} totalGeral={totalGeral} />
        ) : null}
        <Button
          variant={pagamentos.length === 0 ? "outline" : "default"}
          size="sm"
          onClick={() => setCreating(true)}
        >
          + Parcela individual
        </Button>
      </div>

      {ativas.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          Nenhuma parcela cadastrada.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ativas.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">#{p.ordem}</span>
                  <span className="font-medium">{formatBRL(p.valor)}</span>
                  <span className="text-xs text-muted-foreground">
                    {PAGAMENTO_METODO_LABEL[p.metodo]}
                  </span>
                  <ParcelaStatusBadge status={p.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Previsto: {formatDate(p.data_prevista)}
                  {p.data_paga ? ` · Pago em ${formatDataPaga(p.data_paga)}` : ""}
                </p>
                {p.observacoes ? (
                  <p className="text-xs text-muted-foreground italic">
                    {p.observacoes}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {(p.status === "pendente" || p.status === "atrasado") && (
                  <Button
                    size="sm"
                    variant="default"
                    disabled={pending}
                    onClick={() => executar(p.id, "marcarPago")}
                  >
                    <CheckCircle2Icon className="mr-1 size-4" />
                    Pago
                  </Button>
                )}
                {p.status === "pago" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => executar(p.id, "reabrir")}
                  >
                    <RotateCcwIcon className="mr-1 size-4" />
                    Reabrir
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setEditing(p)}
                  aria-label="Editar parcela"
                >
                  <PencilIcon className="size-4" />
                </Button>
                {p.status !== "pago" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => executar(p.id, "cancelar")}
                    aria-label="Cancelar parcela"
                  >
                    <XCircleIcon className="size-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || p.status === "pago"}
                  onClick={() => executar(p.id, "excluir")}
                  aria-label="Excluir parcela"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canceladas.length > 0 ? (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">
            Mostrar canceladas ({canceladas.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {canceladas.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <ParcelaStatusBadge status={p.status} />
                <span>
                  #{p.ordem} · {formatBRL(p.valor)} · {PAGAMENTO_METODO_LABEL[p.metodo]}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Dialog
        open={creating || editing !== null}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar parcela" : "Nova parcela"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Status só muda via botões Pago/Reabrir/Cancelar."
                : "Adicione uma parcela individual a esta OS."}
            </DialogDescription>
          </DialogHeader>
          <ParcelaForm
            osId={osId}
            pagamento={editing ?? undefined}
            ordemSugerida={ordemSugerida}
            onSuccess={() => {
              setCreating(false);
              setEditing(null);
            }}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
