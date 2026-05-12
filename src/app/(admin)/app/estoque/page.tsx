import Link from "next/link";
import { ArrowDownUpIcon, PackageIcon, PlusIcon, Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItensListMobile } from "@/features/estoque/components/itens-list-mobile";
import { ItensListTable } from "@/features/estoque/components/itens-list-table";
import { listCategorias, listItens } from "@/features/estoque/queries";
import { EmptyState } from "@/shared/components/empty-state";

type SearchParams = Promise<{
  q?: string;
  categoria?: string;
  abaixo_minimo?: string;
}>;

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const busca = params.q ?? "";
  const categoria_id = params.categoria;
  const abaixo_minimo = params.abaixo_minimo === "1";

  const [itens, categorias] = await Promise.all([
    listItens({ busca, categoria_id, abaixo_minimo, ativo: true }),
    listCategorias(),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            {itens.length} item{itens.length === 1 ? "" : "s"}
            {abaixo_minimo ? " abaixo do mínimo" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/estoque/categorias">
              <Settings2Icon className="mr-1 size-4" />
              Categorias
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/estoque/movimentar">
              <ArrowDownUpIcon className="mr-1 size-4" />
              Movimentar
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/estoque/novo">
              <PlusIcon className="mr-1 size-4" />
              Novo item
            </Link>
          </Button>
        </div>
      </div>

      <form className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
        <Input
          name="q"
          type="search"
          placeholder="Buscar por descrição ou SKU"
          defaultValue={busca}
        />
        <Select name="categoria" defaultValue={categoria_id ?? "all"}>
          <SelectTrigger>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          {abaixo_minimo ? (
            <input type="hidden" name="abaixo_minimo" value="1" />
          ) : null}
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        {abaixo_minimo ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/estoque">Limpar filtro abaixo do mínimo</Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/estoque?abaixo_minimo=1">
              Ver só os abaixo do mínimo
            </Link>
          </Button>
        )}
      </div>

      {itens.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title={
            busca || abaixo_minimo
              ? "Nenhum item encontrado"
              : "Você ainda não tem itens"
          }
          description={
            busca || abaixo_minimo
              ? "Ajuste os filtros ou cadastre um novo item."
              : "Cadastre os itens que você mantém em estoque."
          }
          action={
            <Button asChild>
              <Link href="/app/estoque/novo">Cadastrar primeiro item</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="md:hidden">
            <ItensListMobile items={itens} />
          </div>
          <div className="hidden md:block">
            <ItensListTable items={itens} />
          </div>
        </>
      )}
    </div>
  );
}
