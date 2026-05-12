"use client";

import * as React from "react";
import Link from "next/link";
import {
  DollarSignIcon,
  ExternalLinkIcon,
  PencilIcon,
  ShoppingCartIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/shared/components/money-input";
import { formatBRL } from "@/shared/format/money";
import {
  cancelarLink,
  deleteLink,
  marcarClienteComprou,
  marcarComissaoRecebida,
} from "../actions";
import type { LinkAfiliadoListItem } from "../queries";
import type { LinkAfiliadoStatus } from "../types";
import { LinkForm } from "./link-form";
import { LinkStatusBadge } from "./link-status-badge";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(value),
  );
}

type LinksListProps = {
  links: LinkAfiliadoListItem[];
  showCliente?: boolean;
  showOs?: boolean;
};

export function LinksList({
  links,
  showCliente = true,
  showOs = true,
}: LinksListProps) {
  const [editing, setEditing] = React.useState<LinkAfiliadoListItem | null>(null);
  const [comissaoFor, setComissaoFor] = React.useState<LinkAfiliadoListItem | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();

  if (links.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        Nenhum link registrado.
      </p>
    );
  }

  function executar(id: string, action: "comprou" | "cancelar" | "excluir") {
    startTransition(async () => {
      let result;
      if (action === "comprou") result = await marcarClienteComprou(id);
      else if (action === "cancelar") result = await cancelarLink(id);
      else result = await deleteLink(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const labels = {
        comprou: "Marcado: cliente comprou",
        cancelar: "Link cancelado",
        excluir: "Link excluído",
      };
      toast.success(labels[action]);
    });
  }

  const buckets: Array<{ status: LinkAfiliadoStatus; items: LinkAfiliadoListItem[] }> = [
    { status: "enviado", items: [] },
    { status: "cliente_comprou", items: [] },
    { status: "comissao_recebida", items: [] },
    { status: "cancelado", items: [] },
  ];
  for (const l of links) {
    const bucket = buckets.find((b) => b.status === l.status);
    bucket?.items.push(l);
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {buckets.map((b) =>
          b.items.length === 0 ? null : (
            <section key={b.status} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <LinkStatusBadge status={b.status} />
                <span className="text-xs text-muted-foreground">
                  {b.items.length}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {b.items.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.descricao_peca}</p>
                        <a
                          href={l.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 hover:underline break-all"
                        >
                          <ExternalLinkIcon className="size-3 shrink-0" />
                          <span className="truncate">{l.link}</span>
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {showCliente && l.cliente ? (
                        <Link
                          href={`/app/clientes/${l.cliente.id}`}
                          className="text-foreground hover:underline"
                        >
                          {l.cliente.nome}
                        </Link>
                      ) : null}
                      {showOs && l.os ? (
                        <Link
                          href={`/app/os/${l.os.id}`}
                          className="text-foreground hover:underline"
                        >
                          OS #{l.os.numero}
                        </Link>
                      ) : null}
                      <span>Enviado em {formatDate(l.data_envio)}</span>
                      {l.preco_estimado != null ? (
                        <span>Preço: {formatBRL(l.preco_estimado)}</span>
                      ) : null}
                      {l.comissao_estimada != null ? (
                        <span>Comissão est.: {formatBRL(l.comissao_estimada)}</span>
                      ) : null}
                      {l.comissao_recebida != null ? (
                        <span className="text-emerald-700 dark:text-emerald-300">
                          Recebido: {formatBRL(l.comissao_recebida)}
                        </span>
                      ) : null}
                    </div>
                    {l.observacoes ? (
                      <p className="text-xs text-muted-foreground italic">
                        {l.observacoes}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      {l.status === "enviado" ? (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={pending}
                          onClick={() => executar(l.id, "comprou")}
                        >
                          <ShoppingCartIcon className="mr-1 size-4" />
                          Cliente comprou
                        </Button>
                      ) : null}
                      {l.status === "cliente_comprou" ? (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={pending}
                          onClick={() => setComissaoFor(l)}
                        >
                          <DollarSignIcon className="mr-1 size-4" />
                          Marcar comissão
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending || l.status === "comissao_recebida"}
                        onClick={() => setEditing(l)}
                        aria-label="Editar link"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      {l.status !== "cancelado" &&
                      l.status !== "comissao_recebida" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => executar(l.id, "cancelar")}
                          aria-label="Cancelar link"
                        >
                          <XCircleIcon className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending || l.status === "comissao_recebida"}
                        onClick={() => executar(l.id, "excluir")}
                        aria-label="Excluir link"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar link</DialogTitle>
            <DialogDescription>
              Status só muda pelos botões abaixo de cada item.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <LinkForm
              link={editing}
              onSuccess={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ComissaoDialog
        link={comissaoFor}
        onClose={() => setComissaoFor(null)}
      />
    </>
  );
}

function ComissaoDialog({
  link,
  onClose,
}: {
  link: LinkAfiliadoListItem | null;
  onClose: () => void;
}) {
  const [valor, setValor] = React.useState("0.00");
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (link) {
      setValor(
        link.comissao_estimada != null
          ? Number(link.comissao_estimada).toFixed(2)
          : "0.00",
      );
    }
  }, [link]);

  function handleConfirm() {
    if (!link) return;
    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Valor inválido");
      return;
    }
    startTransition(async () => {
      const result = await marcarComissaoRecebida(link.id, {
        comissao_recebida: n,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Comissão registrada: ${formatBRL(n)}`);
      onClose();
    });
  }

  return (
    <Dialog open={link !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar comissão recebida</DialogTitle>
          <DialogDescription>
            {link?.descricao_peca}. Informe o valor exato que o Mercado Livre
            pagou.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          <Label htmlFor="comissao-valor">Valor recebido</Label>
          <MoneyInput
            value={valor}
            onValueChange={setValor}
          />
          <Input id="comissao-valor" type="hidden" value={valor} readOnly />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={pending}>
            {pending ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
