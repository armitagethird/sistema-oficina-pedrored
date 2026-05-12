import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDownUpIcon,
  ChevronLeftIcon,
  PackageIcon,
  PencilIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertaMinimoBadge } from "@/features/estoque/components/alerta-minimo-badge";
import { MovimentacoesList } from "@/features/estoque/components/movimentacoes-list";
import { getItem, listMovimentacoes } from "@/features/estoque/queries";
import { formatBRL } from "@/shared/format/money";

type Params = Promise<{ id: string }>;

export default async function ItemDetalhePage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const movimentacoes = await listMovimentacoes({ item_id: id, limit: 50 });
  const qtd = Number(item.quantidade_atual);
  const margem = Number(item.preco_venda) - Number(item.custo_medio);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/estoque">
            <ChevronLeftIcon className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/estoque/movimentar?item=${item.id}`}>
              <ArrowDownUpIcon className="mr-1 size-4" />
              Movimentar
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/estoque/${item.id}/editar`}>
              <PencilIcon className="mr-1 size-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <PackageIcon className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl">{item.descricao}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {item.categoria?.nome ? (
                  <Badge variant="secondary" className="font-normal">
                    {item.categoria.nome}
                  </Badge>
                ) : null}
                {item.sku ? <span>SKU: {item.sku}</span> : null}
                <AlertaMinimoBadge
                  qtdAtual={qtd}
                  alertaMinimo={Number(item.alerta_minimo)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Quantidade</span>
            <span className="text-lg font-semibold tabular-nums">
              {qtd} {item.unidade}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Custo médio</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatBRL(item.custo_medio)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Preço venda</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatBRL(item.preco_venda)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Margem unit.</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatBRL(margem)}
            </span>
          </div>
          {item.observacoes ? (
            <div className="sm:col-span-4 rounded-md bg-muted/30 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Observações
              </p>
              <p className="mt-1 whitespace-pre-wrap">{item.observacoes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <MovimentacoesList items={movimentacoes} />
        </CardContent>
      </Card>
    </div>
  );
}
