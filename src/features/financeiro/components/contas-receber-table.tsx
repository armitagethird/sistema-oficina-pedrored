"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangleIcon, ChevronDownIcon, PhoneIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/shared/format/money";
import type { ContasReceberRow } from "../types";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function ContasReceberTable({ rows }: { rows: ContasReceberRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        Nenhuma conta em aberto. Tudo em dia.
      </p>
    );
  }

  return (
    <Accordion type="multiple" className="flex flex-col gap-2">
      {rows.map((row) => {
        const atrasadas = Number(row.parcelas_atrasadas ?? 0);
        const tem = atrasadas > 0;
        return (
          <AccordionItem
            key={row.cliente_id ?? row.cliente_nome ?? Math.random().toString()}
            value={row.cliente_id ?? ""}
            className="rounded-md border bg-card"
          >
            <AccordionTrigger className="px-3 py-3 hover:no-underline">
              <div className="flex flex-1 flex-col items-start gap-1 text-left">
                <div className="flex w-full items-center justify-between gap-3">
                  <p className="font-medium truncate">{row.cliente_nome}</p>
                  <span
                    className={cn(
                      "font-semibold",
                      tem && "text-red-700 dark:text-red-300",
                    )}
                  >
                    {formatBRL(row.total_em_aberto ?? 0)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {row.parcelas_em_aberto} parcela
                    {Number(row.parcelas_em_aberto) === 1 ? "" : "s"} em aberto
                  </span>
                  {tem ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200 border-0"
                    >
                      <AlertTriangleIcon className="size-3" />
                      {atrasadas} atrasada{atrasadas === 1 ? "" : "s"} ·{" "}
                      {formatBRL(row.total_atrasado ?? 0)}
                    </Badge>
                  ) : null}
                  {row.proxima_data ? (
                    <span>Próximo: {formatDate(row.proxima_data)}</span>
                  ) : null}
                </div>
              </div>
              <ChevronDownIcon className="ml-2 size-4 shrink-0 text-muted-foreground transition-transform" />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {row.telefone ? (
                  <a
                    href={`tel:${row.telefone}`}
                    className="flex items-center gap-1 text-foreground hover:underline"
                  >
                    <PhoneIcon className="size-3" />
                    {row.telefone}
                  </a>
                ) : null}
                <Link
                  href={`/app/clientes/${row.cliente_id}`}
                  className="text-foreground hover:underline"
                >
                  Ver cliente
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
