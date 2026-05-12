import Link from "next/link";
import { PackageIcon, PlusIcon, ReceiptIcon, Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PedidoCard } from "@/features/loja/components/admin/pedido-card";
import { listPedidosAdmin } from "@/features/loja/queries";

export default async function LojaDashboardPage() {
  const pedidos = await listPedidosAdmin({ limit: 10 });
  const pendentes = pedidos.filter(
    (p) => p.status === "aguardando_pagamento" || p.status === "pagamento_em_analise",
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loja</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciamento de produtos e pedidos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/loja/configuracoes">
              <Settings2Icon className="mr-1 size-4" />
              Configurações
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/loja/produtos/novo">
              <PlusIcon className="mr-1 size-4" />
              Novo produto
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link href="/app/loja/pedidos">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Pedidos pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {pendentes.length}
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/loja/produtos">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-base font-medium">Produtos</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-3xl font-semibold">
              <PackageIcon className="size-6 text-muted-foreground" />
              Gerenciar
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/loja/pedidos">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-base font-medium">Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-3xl font-semibold">
              <ReceiptIcon className="size-6 text-muted-foreground" />
              Ver todos
            </CardContent>
          </Card>
        </Link>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pedidos recentes</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/loja/pedidos">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pedidos.length === 0 ? (
            <p className="rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Nenhum pedido ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pedidos.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <PedidoCard pedido={p} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
