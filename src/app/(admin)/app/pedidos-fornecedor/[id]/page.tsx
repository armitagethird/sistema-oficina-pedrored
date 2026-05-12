import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarIcon,
  ChevronLeftIcon,
  FactoryIcon,
  PencilIcon,
  ReceiptIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LancarEstoqueButton } from "@/features/pedidos-fornecedor/components/lancar-estoque-button";
import { PedidoItensItemized } from "@/features/pedidos-fornecedor/components/pedido-itens-itemized";
import { PedidoStatusBadge } from "@/features/pedidos-fornecedor/components/pedido-status-badge";
import { PedidoStatusChanger } from "@/features/pedidos-fornecedor/components/pedido-status-changer";
import { contarEntradasLancadas, getPedido } from "@/features/pedidos-fornecedor/queries";
import { formatBRL } from "@/shared/format/money";

type Params = Promise<{ id: string }>;

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export default async function PedidoFornecedorDetalhePage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const pedido = await getPedido(id);
  if (!pedido) notFound();

  const readonly = pedido.status === "cancelado";
  const itensComEstoque = pedido.itens.filter((it) => it.item_estoque_id).length;
  const entradasLancadas =
    pedido.status === "recebido" ? await contarEntradasLancadas(id) : 0;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/pedidos-fornecedor">
            <ChevronLeftIcon className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <PedidoStatusChanger pedidoId={pedido.id} current={pedido.status} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/pedidos-fornecedor/${pedido.id}/editar`}>
              <PencilIcon className="mr-1 size-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground shrink-0">
                <ReceiptIcon className="size-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-xl">
                  Pedido #{pedido.numero}
                </CardTitle>
                {pedido.fornecedor ? (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                    <FactoryIcon className="size-4" />
                    <Link
                      href={`/app/fornecedores/${pedido.fornecedor.id}`}
                      className="hover:underline"
                    >
                      {pedido.fornecedor.nome}
                    </Link>
                  </p>
                ) : null}
              </div>
            </div>
            <PedidoStatusBadge status={pedido.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-medium">{formatBRL(pedido.valor_total)}</p>
            </div>
            {pedido.data_compra ? (
              <div>
                <p className="text-xs text-muted-foreground">Comprado em</p>
                <p className="flex items-center gap-1 font-medium">
                  <CalendarIcon className="size-3 text-muted-foreground" />
                  {formatDate(pedido.data_compra)}
                </p>
              </div>
            ) : null}
            {pedido.data_recebimento ? (
              <div>
                <p className="text-xs text-muted-foreground">Recebido em</p>
                <p className="flex items-center gap-1 font-medium">
                  <CalendarIcon className="size-3 text-muted-foreground" />
                  {formatDate(pedido.data_recebimento)}
                </p>
              </div>
            ) : null}
          </div>
          {pedido.os ? (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">OS vinculada</p>
                <Link
                  href={`/app/os/${pedido.os.id}`}
                  className="font-medium hover:underline"
                >
                  #{pedido.os.numero}
                  {pedido.os.cliente ? ` · ${pedido.os.cliente.nome}` : ""}
                </Link>
              </div>
            </>
          ) : null}
          {pedido.observacoes ? (
            <>
              <Separator />
              <div className="rounded-md bg-muted/30 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">
                  Observações
                </p>
                <p className="mt-1 whitespace-pre-wrap">{pedido.observacoes}</p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Itens</CardTitle>
          {pedido.status === "recebido" ? (
            <LancarEstoqueButton
              pedidoId={pedido.id}
              itensComEstoque={itensComEstoque}
              entradasLancadas={entradasLancadas}
            />
          ) : null}
        </CardHeader>
        <CardContent>
          <PedidoItensItemized
            pedidoId={pedido.id}
            itens={pedido.itens}
            readonly={readonly}
          />
        </CardContent>
      </Card>
    </div>
  );
}
