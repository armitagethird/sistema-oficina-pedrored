import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon } from "lucide-react";

import { ProdutoGrid } from "@/features/loja/components/publico/produto-grid";
import { CONTATO } from "@/features/loja/contato";
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
    <div className="bg-background">
      <section className="border-b border-[color:var(--hairline)] bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 md:px-8 md:pb-16 md:pt-20">
          <div className="flex flex-col gap-6">
            <span className="eyebrow">§ CATÁLOGO COMPLETO</span>
            <h1 className="text-display text-6xl uppercase leading-[0.82] md:text-8xl lg:text-[10rem]">
              Peças
              <br />
              <span className="text-[color:var(--accent-red)]">TSI · MSI</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {total} {total === 1 ? "peça selecionada" : "peças selecionadas"}{" "}
              por Pedro para a linha Volkswagen turbo. Curadoria por motor,
              não por marca.
            </p>
          </div>

          <form className="mt-10 flex items-stretch gap-px bg-[color:var(--hairline)] md:mt-14 md:max-w-xl">
            <div className="flex flex-1 items-center gap-3 bg-background px-4">
              <SearchIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <input
                name="q"
                type="search"
                placeholder="Buscar peça, motor, modelo…"
                defaultValue={busca}
                className="text-display w-full bg-transparent py-3 text-sm uppercase tracking-[0.12em] text-foreground placeholder:text-muted-foreground/70 focus:outline-none md:py-4"
              />
            </div>
            <button
              type="submit"
              className="text-display bg-foreground px-6 text-xs uppercase tracking-[0.2em] text-background transition-colors hover:bg-[color:var(--accent-red)] md:px-8"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        {items.length === 0 ? (
          <div className="border border-[color:var(--hairline)] p-8 text-center text-muted-foreground md:p-16">
            {busca ? (
              <>
                <span className="eyebrow mb-3 block text-foreground/55">
                  § SEM RESULTADO
                </span>
                <p className="text-display text-2xl uppercase leading-tight md:text-3xl">
                  Nada encontrado para “{busca}”.
                </p>
                <p className="mt-3 text-sm">
                  Tente outro termo ou{" "}
                  <a
                    href={CONTATO.whatsapp.href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline transition-colors hover:text-[color:var(--accent-red)]"
                  >
                    pergunta direto pro Pedro
                  </a>
                  .
                </p>
              </>
            ) : (
              <p className="text-display text-2xl uppercase leading-tight md:text-3xl">
                Catálogo em organização — volte em breve.
              </p>
            )}
          </div>
        ) : (
          <ProdutoGrid produtos={items} />
        )}

        {paginas > 1 ? (
          <nav className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-[color:var(--hairline)] pt-8 md:mt-16">
            {pagina > 1 ? (
              <Link
                href={queryParam(pagina - 1)}
                className="text-display inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:text-[color:var(--accent-red)]"
              >
                <ArrowLeftIcon className="size-4" />
                Anterior
              </Link>
            ) : (
              <span aria-hidden />
            )}
            <span className="text-display text-num text-base uppercase tracking-[0.18em] text-muted-foreground">
              Página{" "}
              <span className="text-foreground">
                {String(pagina).padStart(2, "0")}
              </span>{" "}
              / {String(paginas).padStart(2, "0")}
            </span>
            {pagina < paginas ? (
              <Link
                href={queryParam(pagina + 1)}
                className="text-display inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:text-[color:var(--accent-red)]"
              >
                Próxima
                <ArrowRightIcon className="size-4" />
              </Link>
            ) : (
              <span aria-hidden />
            )}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
