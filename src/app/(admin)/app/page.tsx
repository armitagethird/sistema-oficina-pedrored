import Link from "next/link";
import {
  AlertTriangleIcon,
  CarIcon,
  ClockIcon,
  FileTextIcon,
  PackageIcon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { contarItensAbaixoMinimo } from "@/features/estoque/queries";
import { contarPedidosPendentes } from "@/features/loja/queries";
import { OsListMobile } from "@/features/ordens/components/os-list-mobile";
import { contadoresDashboard, listOSRecentes } from "@/features/ordens/queries";
import type { OSStatus } from "@/features/ordens/types";

type CardSpec = {
  status: OSStatus;
  label: string;
  description: string;
  className: string;
};

const STATUS_CARDS: CardSpec[] = [
  {
    status: "aberta",
    label: "Abertas",
    description: "Aguardando começar",
    className: "border-blue-200 dark:border-blue-900/40",
  },
  {
    status: "em_andamento",
    label: "Em andamento",
    description: "Sendo executadas",
    className: "border-amber-200 dark:border-amber-900/40",
  },
  {
    status: "aguardando_peca",
    label: "Aguardando peça",
    description: "Esperando fornecedor",
    className: "border-orange-200 dark:border-orange-900/40",
  },
  {
    status: "pronta",
    label: "Prontas",
    description: "Para retirar",
    className: "border-emerald-200 dark:border-emerald-900/40",
  },
];

export default async function DashboardPage() {
  const [contadores, recentes, abaixoMinimo, pedidosPendentes] =
    await Promise.all([
      contadoresDashboard(),
      listOSRecentes(5),
      contarItensAbaixoMinimo(),
      contarPedidosPendentes(),
    ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Olá, Pedro</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da oficina.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/os/nova">
            <PlusIcon className="mr-1 size-4" />
            Nova OS
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_CARDS.map((c) => (
          <Link key={c.status} href={`/app/os?status=${c.status}`}>
            <Card className={`transition-colors hover:bg-accent ${c.className}`}>
              <CardHeader>
                <CardTitle className="text-base font-medium">{c.label}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {contadores[c.status]}
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {abaixoMinimo > 0 || pedidosPendentes > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {abaixoMinimo > 0 ? (
            <Link href="/app/estoque?abaixo_minimo=1">
              <Card
                className={cn(
                  "border-red-300 transition-colors hover:bg-accent dark:border-red-900/40",
                )}
              >
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    <AlertTriangleIcon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      Estoque baixo
                    </CardTitle>
                    <CardDescription>
                      {abaixoMinimo} item{abaixoMinimo === 1 ? "" : "s"} abaixo
                      do mínimo
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ) : null}
          {pedidosPendentes > 0 ? (
            <Link href="/app/loja/pedidos">
              <Card className="border-amber-300 transition-colors hover:bg-accent dark:border-amber-900/40">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <AlertTriangleIcon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      Pedidos da loja pendentes
                    </CardTitle>
                    <CardDescription>
                      {pedidosPendentes} pedido
                      {pedidosPendentes === 1 ? "" : "s"} aguardando pagamento
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">OS recentes</CardTitle>
              <CardDescription>Últimas 5 ordens</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/os">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <FileTextIcon className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma OS ainda. Abra a primeira agora.
                </p>
                <Button asChild size="sm">
                  <Link href="/app/os/nova">Abrir OS</Link>
                </Button>
              </div>
            ) : (
              <OsListMobile items={recentes} />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Atalhos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/app/clientes">
                  <CarIcon className="mr-2 size-4" />
                  Clientes
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/app/os">
                  <FileTextIcon className="mr-2 size-4" />
                  Todas as OS
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/app/estoque">
                  <PackageIcon className="mr-2 size-4" />
                  Estoque
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/app/agenda">
                  <ClockIcon className="mr-2 size-4" />
                  Agenda
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totais</CardTitle>
              <CardDescription>{contadores.total} OS na base</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Entregues: <span className="font-medium text-foreground">{contadores.entregue}</span>
              </p>
              <p>
                Canceladas: <span className="font-medium text-foreground">{contadores.cancelada}</span>
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs">
                <SettingsIcon className="size-3" />
                Atualizado automaticamente
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
