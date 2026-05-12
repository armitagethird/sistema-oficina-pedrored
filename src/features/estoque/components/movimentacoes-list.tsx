import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/shared/format/money";
import type { MovimentacaoListItem } from "../queries";
import { MOVIMENTACAO_TIPO_LABEL } from "../types";

const BADGE_VARIANT: Record<
  MovimentacaoListItem["tipo"],
  "default" | "destructive" | "outline" | "secondary"
> = {
  entrada: "secondary",
  saida_os: "destructive",
  saida_loja: "destructive",
  ajuste: "outline",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function MovimentacoesList({
  items,
  showItemColumn = false,
}: {
  items: MovimentacaoListItem[];
  showItemColumn?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma movimentação registrada.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            {showItemColumn ? <TableHead>Item</TableHead> : null}
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Custo unit.</TableHead>
            <TableHead className="text-right">Saldo após</TableHead>
            <TableHead>Observação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((m) => {
            const sign =
              m.tipo === "entrada" || m.tipo === "ajuste" ? "+" : "−";
            return (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {DATE_FORMATTER.format(new Date(m.criado_em))}
                </TableCell>
                <TableCell>
                  <Badge variant={BADGE_VARIANT[m.tipo]} className="font-normal">
                    {MOVIMENTACAO_TIPO_LABEL[m.tipo]}
                  </Badge>
                </TableCell>
                {showItemColumn ? (
                  <TableCell className="font-medium">
                    {m.item?.descricao ?? "—"}
                  </TableCell>
                ) : null}
                <TableCell className="text-right tabular-nums">
                  {sign}
                  {Number(m.quantidade)} {m.item?.unidade ?? ""}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.custo_unitario != null
                    ? formatBRL(m.custo_unitario)
                    : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {Number(m.saldo_apos)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.ajuste_motivo ||
                    (m.os_id ? `OS #${m.os_id.slice(0, 8)}` : "—")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
