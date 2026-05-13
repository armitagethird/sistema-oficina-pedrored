import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendamentoForm } from "@/features/agenda/components/AgendamentoForm";
import { createClient } from "@/lib/supabase/server";
import { descreveVeiculo } from "@/features/veiculos/types";

interface Props {
  searchParams: Promise<{ data?: string }>;
}

export default async function NovoAgendamentoPage({ searchParams }: Props) {
  const { data: dataInicial } = await searchParams;
  const supabase = await createClient();

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
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Agenda
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Novo Agendamento</h1>
      </div>
      <AgendamentoForm
        clientes={clientes}
        veiculos={veiculos}
        dataInicial={dataInicial}
      />
    </div>
  );
}
