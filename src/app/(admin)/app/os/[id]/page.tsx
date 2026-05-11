import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OsDetalheTabs } from "@/features/ordens/components/os-detalhe-tabs";
import { OsStatusBadge } from "@/features/ordens/components/os-status-badge";
import { OsStatusChanger } from "@/features/ordens/components/os-status-changer";
import { getOSDetalhe } from "@/features/ordens/queries";
import { descreveVeiculo } from "@/features/veiculos/types";

type Params = Promise<{ id: string }>;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function OSDetalhePage({ params }: { params: Params }) {
  const { id } = await params;
  const os = await getOSDetalhe(id);
  if (!os) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/os">
            <ChevronLeftIcon className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <OsStatusChanger
          osId={os.id}
          currentStatus={os.status}
          kmEntrada={os.km_entrada}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">OS #{os.numero}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Aberta em {dateFormatter.format(new Date(os.criado_em))}
                {os.fechado_em
                  ? ` · Fechada em ${dateFormatter.format(new Date(os.fechado_em))}`
                  : ""}
              </p>
            </div>
            <OsStatusBadge status={os.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {os.cliente ? (
            <Link
              href={`/app/clientes/${os.cliente.id}`}
              className="text-foreground hover:underline"
            >
              <span className="text-muted-foreground">Cliente:</span>{" "}
              <span className="font-medium">{os.cliente.nome}</span>
              {os.cliente.telefone ? ` · ${os.cliente.telefone}` : ""}
            </Link>
          ) : null}
          <Link
            href={`/app/veiculos/${os.veiculo.id}`}
            className="text-foreground hover:underline"
          >
            <span className="text-muted-foreground">Veículo:</span>{" "}
            <span className="font-medium">{descreveVeiculo(os.veiculo)}</span>
          </Link>
        </CardContent>
      </Card>

      <OsDetalheTabs os={os} />
    </div>
  );
}
