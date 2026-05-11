import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CarIcon,
  ChevronLeftIcon,
  PencilIcon,
  UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KmTimeline } from "@/features/veiculos/components/km-timeline";
import {
  getClienteFromVeiculo,
  getVeiculo,
  listKmTimelineVeiculo,
} from "@/features/veiculos/queries";
import { descreveVeiculo } from "@/features/veiculos/types";

type Params = Promise<{ id: string }>;

export default async function VeiculoDetalhePage({ params }: { params: Params }) {
  const { id } = await params;
  const veiculo = await getVeiculo(id);
  if (!veiculo) notFound();

  const [comCliente, timeline] = await Promise.all([
    getClienteFromVeiculo(id),
    listKmTimelineVeiculo(id),
  ]);
  const cliente = comCliente?.cliente ?? null;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={cliente ? `/app/clientes/${cliente.id}` : "/app/clientes"}>
            <ChevronLeftIcon className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/app/veiculos/${veiculo.id}/editar`}>
            <PencilIcon className="mr-1 size-4" />
            Editar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <CarIcon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{descreveVeiculo(veiculo)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {veiculo.km_atual?.toLocaleString("pt-BR") ?? 0} km
                {veiculo.cor ? ` • ${veiculo.cor}` : ""}
              </p>
            </div>
          </div>
        </CardHeader>
        {cliente ? (
          <CardContent className="text-sm">
            <Link
              href={`/app/clientes/${cliente.id}`}
              className="inline-flex items-center gap-2 text-foreground hover:underline"
            >
              <UserIcon className="size-4 text-muted-foreground" />
              {cliente.nome}
            </Link>
            {veiculo.observacoes ? (
              <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                {veiculo.observacoes}
              </p>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de KM</CardTitle>
        </CardHeader>
        <CardContent>
          <KmTimeline registros={timeline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Listagem virá na próxima wave (feature ordens).
        </CardContent>
      </Card>
    </div>
  );
}
