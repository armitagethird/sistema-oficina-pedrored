import { notFound } from "next/navigation";

import { VeiculoForm } from "@/features/veiculos/components/veiculo-form";
import { getCliente } from "@/features/clientes/queries";

type SearchParams = Promise<{ cliente_id?: string }>;

export default async function NovoVeiculoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  if (!params.cliente_id) notFound();
  const cliente = await getCliente(params.cliente_id);
  if (!cliente) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Novo veículo</h1>
        <p className="text-sm text-muted-foreground">
          Cliente: {cliente.nome}
        </p>
      </header>
      <VeiculoForm
        clienteId={cliente.id}
        redirectTo={`/app/clientes/${cliente.id}`}
      />
    </div>
  );
}
