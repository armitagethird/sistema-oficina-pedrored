import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CarIcon,
  ChevronLeftIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCliente } from "@/features/clientes/queries";
import type { EnderecoCliente } from "@/features/clientes/types";
import { VeiculoCard } from "@/features/veiculos/components/veiculo-card";
import { listVeiculosByCliente } from "@/features/veiculos/queries";

type Params = Promise<{ id: string }>;

export default async function ClienteDetalhePage({ params }: { params: Params }) {
  const { id } = await params;
  const [cliente, veiculos] = await Promise.all([
    getCliente(id),
    listVeiculosByCliente(id),
  ]);
  if (!cliente) notFound();

  const endereco = (cliente.endereco ?? null) as EnderecoCliente | null;
  const enderecoLinhas = endereco
    ? [
        [endereco.rua, endereco.numero].filter(Boolean).join(", "),
        [endereco.bairro, endereco.cidade].filter(Boolean).join(" — "),
        [endereco.cep, endereco.complemento].filter(Boolean).join(" • "),
      ].filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/clientes">
            <ChevronLeftIcon className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/app/clientes/${cliente.id}/editar`}>
            <PencilIcon className="mr-1 size-4" />
            Editar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <UserIcon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{cliente.nome}</CardTitle>
              {cliente.cpf ? (
                <p className="text-sm text-muted-foreground">CPF: {cliente.cpf}</p>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {cliente.telefone ? (
            <a
              href={`tel:${cliente.telefone}`}
              className="flex items-center gap-2 text-foreground hover:underline"
            >
              <PhoneIcon className="size-4 text-muted-foreground" />
              {cliente.telefone}
            </a>
          ) : null}
          {cliente.email ? (
            <a
              href={`mailto:${cliente.email}`}
              className="flex items-center gap-2 text-foreground hover:underline"
            >
              <MailIcon className="size-4 text-muted-foreground" />
              {cliente.email}
            </a>
          ) : null}
          {enderecoLinhas.length > 0 ? (
            <div className="mt-2 text-muted-foreground">
              {enderecoLinhas.map((linha, i) => (
                <p key={i}>{linha}</p>
              ))}
            </div>
          ) : null}
          {cliente.observacoes ? (
            <div className="mt-3 rounded-md bg-muted/30 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Observações
              </p>
              <p className="mt-1 whitespace-pre-wrap">{cliente.observacoes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">
              Veículos ({veiculos.length})
            </CardTitle>
            <Button asChild size="sm">
              <Link href={`/app/veiculos/novo?cliente_id=${cliente.id}`}>
                <PlusIcon className="mr-1 size-4" />
                Novo
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {veiculos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm">
              <CarIcon className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-muted-foreground">Nenhum veículo cadastrado.</p>
              <Button asChild size="sm">
                <Link href={`/app/veiculos/novo?cliente_id=${cliente.id}`}>
                  Cadastrar veículo
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {veiculos.map((v) => (
                <li key={v.id}>
                  <VeiculoCard veiculo={v} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Lista virá na próxima wave (feature ordens).
        </CardContent>
      </Card>
    </div>
  );
}
