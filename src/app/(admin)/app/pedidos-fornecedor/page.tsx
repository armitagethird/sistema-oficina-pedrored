import Link from "next/link";
import { PlusIcon, ReceiptIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PedidoCard } from "@/features/pedidos-fornecedor/components/pedido-card";
import { listPedidos } from "@/features/pedidos-fornecedor/queries";
import { EmptyState } from "@/shared/components/empty-state";

export default async function PedidosFornecedorPage() {
  const pedidos = await listPedidos();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pedidos a fornecedor
          </h1>
          <p className="text-sm text-muted-foreground">
            {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/pedidos-fornecedor/novo">
            <PlusIcon className="mr-1 size-4" />
            Novo
          </Link>
        </Button>
      </div>

      {pedidos.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="Nenhum pedido cadastrado"
          description="Cadastre pedidos a fornecedores para controlar capital investido e custo de peças."
          action={
            <Button asChild>
              <Link href="/app/pedidos-fornecedor/novo">Novo pedido</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {pedidos.map((pedido) => (
            <li key={pedido.id}>
              <PedidoCard pedido={pedido} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
