import { notFound } from "next/navigation";

import { ClienteForm } from "@/features/clientes/components/cliente-form";
import { getCliente } from "@/features/clientes/queries";

type Params = Promise<{ id: string }>;

export default async function EditarClientePage({ params }: { params: Params }) {
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Editar cliente</h1>
        <p className="text-sm text-muted-foreground">{cliente.nome}</p>
      </header>
      <ClienteForm cliente={cliente} redirectTo={`/app/clientes/${cliente.id}`} />
    </div>
  );
}
