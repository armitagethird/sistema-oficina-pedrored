import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2Icon,
  ChevronLeftIcon,
  FactoryIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFornecedor } from "@/features/fornecedores/queries";

type Params = Promise<{ id: string }>;

export default async function FornecedorDetalhePage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const fornecedor = await getFornecedor(id);
  if (!fornecedor) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/fornecedores">
            <ChevronLeftIcon className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/app/fornecedores/${fornecedor.id}/editar`}>
            <PencilIcon className="mr-1 size-4" />
            Editar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <FactoryIcon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{fornecedor.nome}</CardTitle>
              {fornecedor.cnpj ? (
                <p className="text-sm text-muted-foreground">
                  CNPJ: {fornecedor.cnpj}
                </p>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {fornecedor.telefone ? (
            <a
              href={`tel:${fornecedor.telefone}`}
              className="flex items-center gap-2 text-foreground hover:underline"
            >
              <PhoneIcon className="size-4 text-muted-foreground" />
              {fornecedor.telefone}
            </a>
          ) : null}
          {fornecedor.email ? (
            <a
              href={`mailto:${fornecedor.email}`}
              className="flex items-center gap-2 text-foreground hover:underline"
            >
              <MailIcon className="size-4 text-muted-foreground" />
              {fornecedor.email}
            </a>
          ) : null}
          {fornecedor.endereco ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Building2Icon className="size-4" />
              {fornecedor.endereco}
            </p>
          ) : null}
          {fornecedor.observacoes ? (
            <div className="mt-3 rounded-md bg-muted/30 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Observações
              </p>
              <p className="mt-1 whitespace-pre-wrap">{fornecedor.observacoes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos de peças</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Lista virá com a feature de pedidos a fornecedor.
        </CardContent>
      </Card>
    </div>
  );
}
