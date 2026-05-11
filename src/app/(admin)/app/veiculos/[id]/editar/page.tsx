import { notFound } from "next/navigation";

import { VeiculoForm } from "@/features/veiculos/components/veiculo-form";
import { getVeiculo } from "@/features/veiculos/queries";
import { descreveVeiculo } from "@/features/veiculos/types";

type Params = Promise<{ id: string }>;

export default async function EditarVeiculoPage({ params }: { params: Params }) {
  const { id } = await params;
  const veiculo = await getVeiculo(id);
  if (!veiculo) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Editar veículo</h1>
        <p className="text-sm text-muted-foreground">{descreveVeiculo(veiculo)}</p>
      </header>
      <VeiculoForm
        clienteId={veiculo.cliente_id}
        veiculo={veiculo}
        redirectTo={`/app/veiculos/${veiculo.id}`}
      />
    </div>
  );
}
