import { notFound } from "next/navigation";

import { PedidoForm } from "@/features/pedidos-fornecedor/components/pedido-form";
import { getPedido } from "@/features/pedidos-fornecedor/queries";

type Params = Promise<{ id: string }>;

export default async function EditarPedidoFornecedorPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const pedido = await getPedido(id);
  if (!pedido) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Editar pedido</h1>
        <p className="text-sm text-muted-foreground">
          Pedido #{pedido.numero} · {pedido.fornecedor?.nome ?? "—"}
        </p>
      </header>
      <PedidoForm pedido={pedido} />
    </div>
  );
}
