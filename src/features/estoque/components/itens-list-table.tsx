import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/shared/format/money";
import type { ItemListItem } from "../queries";
import { AlertaMinimoBadge } from "./alerta-minimo-badge";

export function ItensListTable({ items }: { items: ItemListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Custo médio</TableHead>
            <TableHead className="text-right">Venda</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/app/estoque/${item.id}`}
                  className="hover:underline"
                >
                  {item.descricao}
                </Link>
              </TableCell>
              <TableCell>
                {item.categoria?.nome ? (
                  <Badge variant="secondary" className="font-normal">
                    {item.categoria.nome}
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {Number(item.quantidade_atual)} {item.unidade}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(item.custo_medio)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(item.preco_venda)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.sku ?? "—"}
              </TableCell>
              <TableCell>
                <AlertaMinimoBadge
                  qtdAtual={Number(item.quantidade_atual)}
                  alertaMinimo={Number(item.alerta_minimo)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
