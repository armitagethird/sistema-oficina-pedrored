import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoriasManager } from "@/features/estoque/components/categorias-manager";
import { listCategorias } from "@/features/estoque/queries";

export default async function CategoriasPage() {
  const categorias = await listCategorias();
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/estoque">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Categorias de estoque</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CategoriasManager categorias={categorias} />
        </CardContent>
      </Card>
    </div>
  );
}
