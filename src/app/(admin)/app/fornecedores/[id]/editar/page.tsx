import { notFound } from "next/navigation";

import { FornecedorForm } from "@/features/fornecedores/components/fornecedor-form";
import { getFornecedor } from "@/features/fornecedores/queries";

type Params = Promise<{ id: string }>;

export default async function EditarFornecedorPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const fornecedor = await getFornecedor(id);
  if (!fornecedor) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Editar fornecedor</h1>
        <p className="text-sm text-muted-foreground">{fornecedor.nome}</p>
      </header>
      <FornecedorForm
        fornecedor={fornecedor}
        redirectTo={`/app/fornecedores/${fornecedor.id}`}
      />
    </div>
  );
}
