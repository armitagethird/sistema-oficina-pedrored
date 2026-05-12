import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemForm } from "@/features/estoque/components/item-form";
import { getItem, listCategorias } from "@/features/estoque/queries";

type Params = Promise<{ id: string }>;

export default async function EditarItemPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const [item, categorias] = await Promise.all([
    getItem(id),
    listCategorias(),
  ]);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={`/app/estoque/${item.id}`}>
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Editar {item.descricao}</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemForm
            item={item}
            categorias={categorias}
            redirectTo={`/app/estoque/${item.id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
