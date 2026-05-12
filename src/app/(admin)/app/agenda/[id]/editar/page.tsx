import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAgendamento } from "@/features/agenda/queries";
import { AgendamentoForm } from "@/features/agenda/components/AgendamentoForm";
import { createClient } from "@/lib/supabase/server";

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

  const [{ data: clientes }, { data: veiculos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("veiculos")
      .select("id, modelo, placa, cliente_id")
      .eq("ativo", true)
      .order("modelo"),
  ]);

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
        clientes={clientes ?? []}
        veiculos={veiculos ?? []}
        agendamento={agendamento}
      />
    </div>
  );
}
