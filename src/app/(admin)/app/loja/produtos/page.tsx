import Link from "next/link";
import { ChevronLeftIcon, PackageIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProdutosList } from "@/features/loja/components/admin/produtos-list";
import { listProdutosAdmin } from "@/features/loja/queries";
import { EmptyState } from "@/shared/components/empty-state";

type SearchParams = Promise<{ q?: string }>;

export default async function ProdutosAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const busca = q ?? "";
  const produtos = await listProdutosAdmin({ busca });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/loja">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {produtos.length} produto{produtos.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/app/loja/produtos/novo">
            <PlusIcon className="mr-1 size-4" />
            Novo
          </Link>
        </Button>
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          type="search"
          placeholder="Buscar por título"
          defaultValue={busca}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {produtos.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title={busca ? "Nenhum produto encontrado" : "Sem produtos ainda"}
          description={
            busca
              ? "Tente outro termo."
              : "Cadastre o primeiro produto para começar a vender."
          }
          action={
            <Button asChild>
              <Link href="/app/loja/produtos/novo">Cadastrar produto</Link>
            </Button>
          }
        />
      ) : (
        <ProdutosList produtos={produtos} />
      )}
    </div>
  );
}
