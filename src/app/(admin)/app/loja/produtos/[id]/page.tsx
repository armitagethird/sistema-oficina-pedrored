import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProdutoForm } from "@/features/loja/components/admin/produto-form";
import { getProdutoAdmin } from "@/features/loja/queries";

type Params = Promise<{ id: string }>;

export default async function ProdutoAdminEditPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const produto = await getProdutoAdmin(id);
  if (!produto) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/loja/produtos">
            <ChevronLeftIcon className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/produto/${produto.slug}`} target="_blank">
            Ver na loja
            <ExternalLinkIcon className="ml-1 size-3" />
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{produto.titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProdutoForm produto={produto} />
        </CardContent>
      </Card>
    </div>
  );
}
