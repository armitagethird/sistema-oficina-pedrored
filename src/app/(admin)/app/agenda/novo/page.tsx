import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendamentoForm } from "@/features/agenda/components/AgendamentoForm";
import { createClient } from "@/lib/supabase/server";

interface Props {
  searchParams: Promise<{ data?: string }>;
}

export default async function NovoAgendamentoPage({ searchParams }: Props) {
  const { data: dataInicial } = await searchParams;
  const supabase = await createClient();

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
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Agenda
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Novo Agendamento</h1>
      </div>
      <AgendamentoForm
        clientes={clientes ?? []}
        veiculos={veiculos ?? []}
        dataInicial={dataInicial}
      />
    </div>
  );
}
