import { PedidoForm } from "@/features/pedidos-fornecedor/components/pedido-form";

type SearchParams = Promise<{
  fornecedor_id?: string;
  os_id?: string;
}>;

export default async function NovoPedidoFornecedorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Novo pedido</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre o pedido com os dados básicos. Os itens são adicionados em
          seguida.
        </p>
      </header>
      <PedidoForm
        initialFornecedorId={params.fornecedor_id}
        initialOsId={params.os_id}
      />
    </div>
  );
}
