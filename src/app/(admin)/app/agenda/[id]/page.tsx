import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAgendamento } from "@/features/agenda/queries";
import { AgendaStatusBadge } from "@/features/agenda/components/AgendaStatusBadge";
import { MudarStatusAgendamento } from "@/features/agenda/components/MudarStatusAgendamento";
import { criarOSFromAgendamento } from "@/features/agenda/actions";
import { PERIODO_LABEL } from "@/features/agenda/types";
import { descreveVeiculo } from "@/features/veiculos/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AgendamentoDetailPage({ params }: Props) {
  const { id } = await params;
  const agendamento = await getAgendamento(id);

  if (!agendamento) notFound();

  const dataFormatada = format(
    new Date(agendamento.data + "T12:00:00"),
    "EEEE, d 'de' MMMM 'de' yyyy",
    { locale: ptBR },
  );

  const podeEditarCampos =
    agendamento.status === "agendado" || agendamento.status === "confirmado";

  const podeCriarOS =
    agendamento.status === "em_andamento" &&
    !agendamento.os_id &&
    agendamento.veiculo_id;

  async function handleCriarOS() {
    "use server";
    const result = await criarOSFromAgendamento(id);
    if (result.ok) {
      redirect(`/app/os/${result.data.os_id}`);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/agenda">
              <ChevronLeft className="size-4" />
              Agenda
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Agendamento</h1>
        </div>
        {podeEditarCampos && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/agenda/${id}/editar`}>
              <Edit className="size-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{agendamento.descricao}</CardTitle>
            <AgendaStatusBadge status={agendamento.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="capitalize text-muted-foreground">{dataFormatada}</p>
            <p className="font-medium">{PERIODO_LABEL[agendamento.periodo]}</p>
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Cliente: </span>
              <Link
                href={`/app/clientes/${agendamento.cliente_id}`}
                className="font-medium hover:underline"
              >
                {agendamento.clientes?.nome ?? "—"}
              </Link>
            </p>
            {agendamento.veiculos && (
              <p>
                <span className="text-muted-foreground">Veículo: </span>
                <span className="font-medium">
                  {descreveVeiculo(agendamento.veiculos)}
                </span>
              </p>
            )}
            {agendamento.observacoes && (
              <p>
                <span className="text-muted-foreground">Obs: </span>
                {agendamento.observacoes}
              </p>
            )}
          </div>

          {agendamento.os_id && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">OS vinculada</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/app/os/${agendamento.os_id}`}>
                    <FileText className="size-4" />
                    Ver OS
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <MudarStatusAgendamento
        agendamentoId={id}
        statusAtual={agendamento.status}
      />

      {podeCriarOS && (
        <form action={handleCriarOS}>
          <Button type="submit" className="w-full">
            <FileText className="size-4" />
            Criar OS para este agendamento
          </Button>
        </form>
      )}
    </div>
  );
}
