import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, MapPinIcon, PhoneIcon, ReceiptIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmarPagamentoDialog } from "@/features/loja/components/admin/confirmar-pagamento-dialog";
import { StatusChanger } from "@/features/loja/components/admin/status-changer";
import { PedidoStatusBadge } from "@/features/loja/components/publico/pedido-status-publico";
import { getPedidoDetalhe } from "@/features/loja/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL } from "@/shared/format/money";

type Params = Promise<{ id: string }>;

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

async function getComprovanteSignedUrl(
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const supabase = createServiceClient();
  const { data } = await supabase.storage
    .from("loja-comprovantes")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

async function getItensComEstoque(pedidoId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("itens_pedido_loja")
    .select("produto:produtos_loja(item_estoque_id)")
    .eq("pedido_id", pedidoId);
  type Row = { produto: { item_estoque_id: string | null } | null };
  return (
    (data as unknown as Row[] | null)?.filter((r) => r.produto?.item_estoque_id)
      .length ?? 0
  );
}

export default async function PedidoAdminDetalhePage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const pedido = await getPedidoDetalhe(id);
  if (!pedido) notFound();

  const comprovanteUrl = await getComprovanteSignedUrl(pedido.comprovante_url);
  const itensComEstoque = await getItensComEstoque(id);
  const endereco = pedido.cliente_endereco as {
    cep: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    complemento?: string | null;
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/loja/pedidos">
            <ChevronLeftIcon className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex gap-2">
          <StatusChanger pedidoId={pedido.id} current={pedido.status} />
          {(pedido.status === "aguardando_pagamento" ||
            pedido.status === "pagamento_em_analise") && (
            <ConfirmarPagamentoDialog
              pedidoId={pedido.id}
              itensComEstoque={itensComEstoque}
            />
          )}
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
                <p className="text-sm text-muted-foreground">
                  Aberto em{" "}
                  {DATE_FORMATTER.format(new Date(pedido.criado_em))}
                </p>
              </div>
            </div>
            <PedidoStatusBadge status={pedido.status} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium">{pedido.cliente_nome}</p>
            <a
              href={`https://wa.me/${pedido.cliente_telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <PhoneIcon className="size-3" />
              {pedido.cliente_telefone}
            </a>
            {pedido.cliente_email ? (
              <p className="text-xs text-muted-foreground">
                {pedido.cliente_email}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Endereço</p>
            <p className="flex items-start gap-1 font-medium">
              <MapPinIcon className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
              <span>
                {endereco.rua}, {endereco.numero}
                {endereco.complemento ? `, ${endereco.complemento}` : ""}
                <br />
                {endereco.bairro} · {endereco.cidade}/{endereco.uf}
                <br />
                CEP {endereco.cep}
              </span>
            </p>
          </div>
          <div className="flex justify-between border-t pt-3 sm:col-span-2">
            <span className="text-muted-foreground">Total</span>
            <span className="text-base font-semibold">
              {formatBRL(pedido.valor_total)}
            </span>
          </div>
          {pedido.observacoes_cliente ? (
            <div className="rounded-md bg-muted/30 p-3 text-sm sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">
                Observações do cliente
              </p>
              <p className="mt-1 whitespace-pre-wrap">
                {pedido.observacoes_cliente}
              </p>
            </div>
          ) : null}
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
                className="flex items-center justify-between gap-3 rounded-md border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{it.titulo_snapshot}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBRL(Number(it.preco_unitario))} × {it.quantidade}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">
                  {formatBRL(Number(it.preco_unitario) * it.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {comprovanteUrl ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comprovante PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={comprovanteUrl}
              target="_blank"
              rel="noreferrer"
              className="block max-w-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={comprovanteUrl}
                alt="Comprovante PIX"
                className="w-full rounded-md border"
              />
            </a>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
