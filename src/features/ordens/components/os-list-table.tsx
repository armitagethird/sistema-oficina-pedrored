"use client";

import * as React from "react";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/shared/format/money";
import type { OSListItem } from "../queries";
import { OsStatusBadge } from "./os-status-badge";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function descreveVeiculo(v: OSListItem["veiculo"]): string {
  const modelo = v?.vw_modelo
    ? `${v.vw_modelo.modelo} ${v.vw_modelo.motor}`
    : v?.modelo_custom ?? "—";
  const ano = v?.ano ? ` ${v.ano}` : "";
  const placa = v?.placa ? ` (${v.placa})` : "";
  return `${modelo}${ano}${placa}`;
}

const helper = createColumnHelper<OSListItem>();

const columns = [
  helper.accessor("numero", {
    header: "#",
    cell: (info) => <span className="font-mono">#{info.getValue()}</span>,
  }),
  helper.accessor((row) => row.cliente?.nome ?? "—", {
    id: "cliente",
    header: "Cliente",
    cell: (info) => <span className="truncate">{info.getValue()}</span>,
  }),
  helper.accessor((row) => descreveVeiculo(row.veiculo), {
    id: "veiculo",
    header: "Veículo",
    cell: (info) => (
      <span className="truncate text-muted-foreground">{info.getValue()}</span>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    cell: (info) => <OsStatusBadge status={info.getValue()} />,
  }),
  helper.accessor("criado_em", {
    header: "Aberta em",
    cell: (info) =>
      dateFormatter.format(new Date(info.getValue() as string)),
  }),
  helper.accessor("total_geral", {
    header: "Total",
    cell: (info) => (
      <span className="font-medium">{formatBRL(info.getValue())}</span>
    ),
  }),
];

export function OsListTable({ items }: { items: OSListItem[] }) {
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="cursor-pointer">
              {row.getVisibleCells().map((cell, i) => (
                <TableCell key={cell.id}>
                  <Link
                    href={`/app/os/${row.original.id}`}
                    className="block py-1"
                    aria-label={i === 0 ? `Abrir OS #${row.original.numero}` : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Link>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
