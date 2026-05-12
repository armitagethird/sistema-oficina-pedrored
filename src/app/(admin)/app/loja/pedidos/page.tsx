import Link from "next/link";
import { ChevronLeftIcon, ReceiptIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PedidosList } from "@/features/loja/components/admin/pedidos-list";
import { listPedidosAdmin } from "@/features/loja/queries";
import {
  PEDIDO_LOJA_STATUS_LABEL,
  PEDIDO_LOJA_STATUS_VALUES,
  type PedidoLojaStatus,
} from "@/features/loja/types";
import { EmptyState } from "@/shared/components/empty-state";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function PedidosAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, status } = await searchParams;
  const busca = q ?? "";
  const statusFiltro = (status && status !== "all"
    ? (status as PedidoLojaStatus)
    : undefined);

  const pedidos = await listPedidosAdmin({
    busca,
    status: statusFiltro,
  });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/loja">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <form className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
        <Input
          name="q"
          type="search"
          placeholder="Buscar por nome ou telefone"
          defaultValue={busca}
        />
        <Select name="status" defaultValue={status ?? "all"}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {PEDIDO_LOJA_STATUS_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {PEDIDO_LOJA_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {pedidos.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="Nenhum pedido"
          description={
            busca || statusFiltro
              ? "Ajuste os filtros."
              : "Aguardando o primeiro pedido da loja."
          }
        />
      ) : (
        <PedidosList pedidos={pedidos} />
      )}
    </div>
  );
}
