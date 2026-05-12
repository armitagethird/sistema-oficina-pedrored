import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MovimentacaoForm } from "@/features/estoque/components/movimentacao-form";

type SearchParams = Promise<{ item?: string }>;

export default async function MovimentarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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
          <CardTitle>Nova movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <MovimentacaoForm defaultItemId={params.item} />
        </CardContent>
      </Card>
    </div>
  );
}
