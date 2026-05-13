import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAgendamento } from "@/features/agenda/queries";
import { AgendamentoForm } from "@/features/agenda/components/AgendamentoForm";
import { createClient } from "@/lib/supabase/server";
import { descreveVeiculo } from "@/features/veiculos/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarAgendamentoPage({ params }: Props) {
  const { id } = await params;

  const [agendamento, supabase] = await Promise.all([
    getAgendamento(id),
    createClient(),
  ]);

  if (!agendamento) notFound();
  if (
    agendamento.status === "concluido" ||
    agendamento.status === "cancelado" ||
    agendamento.status === "nao_compareceu"
  ) {
    notFound();
  }

  const [{ data: clientesRaw }, { data: veiculosRaw }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome")
      .is("deletado_em", null)
      .order("nome"),
    supabase
      .from("veiculos")
      .select(
        "id, modelo_custom, motor, ano, placa, cliente_id, vw_modelo:vw_modelos(modelo, motor)",
      )
      .is("deletado_em", null)
      .order("modelo_custom"),
  ]);

  const clientes = clientesRaw ?? [];
  const veiculos = (veiculosRaw ?? []).map((v) => ({
    id: v.id,
    modelo: descreveVeiculo(v),
    placa: v.placa,
    cliente_id: v.cliente_id,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/agenda/${id}`}>
            <ChevronLeft className="size-4" />
            Agendamento
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Editar Agendamento</h1>
      </div>
      <AgendamentoForm
        clientes={clientes}
        veiculos={veiculos}
        agendamento={agendamento}
      />
    </div>
  );
}
