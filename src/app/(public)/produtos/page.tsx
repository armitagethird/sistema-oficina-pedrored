import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProdutoGrid } from "@/features/loja/components/publico/produto-grid";
import { listProdutosPublicos } from "@/features/loja/queries";

type SearchParams = Promise<{ q?: string; p?: string }>;

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const busca = params.q?.trim() ?? "";
  const pagina = Number(params.p) || 1;

  const { items, total, paginas } = await listProdutosPublicos({
    pagina,
    porPagina: 24,
    busca: busca || undefined,
  });

  const queryParam = (p: number) => {
    const sp = new URLSearchParams();
    if (busca) sp.set("q", busca);
    sp.set("p", String(p));
    return `?${sp.toString()}`;
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-6 md:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Catálogo
        </h1>
        <p className="text-sm text-muted-foreground">
          {total} produto{total === 1 ? "" : "s"} disponíve
          {total === 1 ? "l" : "is"}
        </p>
      </header>

      <form className="flex gap-2">
        <Input
          name="q"
          type="search"
          placeholder="Buscar produto"
          defaultValue={busca}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
          {busca
            ? `Nenhum produto encontrado para "${busca}".`
            : "Nenhum produto cadastrado ainda."}
        </div>
      ) : (
        <ProdutoGrid produtos={items} />
      )}

      {paginas > 1 ? (
        <nav className="mt-4 flex items-center justify-center gap-2 text-sm">
          {pagina > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={queryParam(pagina - 1)}>← Anterior</Link>
            </Button>
          ) : null}
          <span className="text-muted-foreground">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Button asChild variant="outline" size="sm">
              <Link href={queryParam(pagina + 1)}>Próxima →</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
