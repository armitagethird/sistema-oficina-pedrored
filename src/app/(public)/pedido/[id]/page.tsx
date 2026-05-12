import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PedidoStatusBadge } from "@/features/loja/components/publico/pedido-status-publico";
import { getPedidoPublico } from "@/features/loja/queries";
import { formatBRL } from "@/shared/format/money";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tel?: string }>;

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function PedidoStatusPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { tel } = await searchParams;
  if (!tel) notFound();

  const pedido = await getPedidoPublico(id, tel);
  if (!pedido) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 md:px-6 md:py-10">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">Pedido #{pedido.numero}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Aberto em {DATE_FORMATTER.format(new Date(pedido.criado_em))}
            </p>
          </div>
          <PedidoStatusBadge status={pedido.status} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium">{pedido.cliente_nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telefone</span>
            <span className="font-medium">{pedido.cliente_telefone}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-muted-foreground">Total</span>
            <span className="text-base font-semibold">
              {formatBRL(pedido.valor_total)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm">
            {pedido.itens.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0 truncate">
                  {it.titulo_snapshot}{" "}
                  <span className="text-muted-foreground">× {it.quantidade}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatBRL(Number(it.preco_unitario) * it.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {pedido.status === "aguardando_pagamento" && (
            <p>
              Aguardando o envio do comprovante PIX.{" "}
              <Link
                href={`/checkout/pagamento?id=${pedido.id}&tel=${encodeURIComponent(tel)}`}
                className="underline hover:text-foreground"
              >
                Voltar ao pagamento
              </Link>
              .
            </p>
          )}
          {pedido.status === "pagamento_em_analise" && (
            <p>
              Comprovante recebido — Pedro está conferindo o pagamento. Em
              breve você recebe confirmação por WhatsApp.
            </p>
          )}
          {pedido.status === "pago" && (
            <p>
              Pagamento confirmado. Pedro vai separar o pedido em breve.
            </p>
          )}
          {pedido.status === "em_separacao" && (
            <p>Pedido em separação.</p>
          )}
          {pedido.status === "enviado" && <p>Pedido enviado!</p>}
          {pedido.status === "retirado" && (
            <p>Pedido retirado — obrigado pela compra!</p>
          )}
          {pedido.status === "cancelado" && (
            <p>Este pedido foi cancelado. Fale com Pedro pra saber mais.</p>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/">Voltar à loja</Link>
      </Button>
    </div>
  );
}
