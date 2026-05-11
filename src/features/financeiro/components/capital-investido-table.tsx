import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/shared/format/money";
import type { CapitalInvestidoRow } from "../types";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function CapitalInvestidoTable({
  rows,
}: {
  rows: CapitalInvestidoRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        Nenhum pedido com capital pendente de recuperação.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const valorPedido = Number(row.valor_total ?? 0);
        const osTotal = Number(row.os_total ?? 0);
        const clientePagou = Number(row.cliente_pagou ?? 0);
        const restanteCliente = Math.max(0, osTotal - clientePagou);
        const semOs = !row.os_id;
        return (
          <li
            key={row.pedido_id ?? Math.random().toString()}
            className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href={`/app/pedidos-fornecedor/${row.pedido_id}`}
                  className="font-medium hover:underline truncate"
                >
                  Pedido #{row.numero}
                </Link>
                <span className="text-xs text-muted-foreground truncate">
                  {row.fornecedor_nome}
                </span>
              </div>
              <span className="font-medium">{formatBRL(valorPedido)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {row.data_compra ? (
                <span>Comprado em {formatDate(row.data_compra)}</span>
              ) : null}
              {semOs ? (
                <Badge variant="secondary" className="border-0">
                  Estoque (sem OS)
                </Badge>
              ) : (
                <>
                  <Link
                    href={`/app/os/${row.os_id}`}
                    className="text-foreground hover:underline"
                  >
                    OS #{row.os_numero}
                  </Link>
                  <span>{row.cliente_nome ?? "—"}</span>
                  <span>
                    Cliente pagou: {formatBRL(clientePagou)} de {formatBRL(osTotal)}
                  </span>
                  <span className="font-medium text-red-700 dark:text-red-300">
                    Falta receber: {formatBRL(restanteCliente)}
                  </span>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
