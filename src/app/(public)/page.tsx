import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CanalYouTube } from "@/features/loja/components/publico/canal-youtube";
import { Hero } from "@/features/loja/components/publico/hero";
import { ProdutoGrid } from "@/features/loja/components/publico/produto-grid";
import { CONTATO } from "@/features/loja/contato";
import {
  listProdutosDestaque,
  listProdutosPublicos,
} from "@/features/loja/queries";
import { getUltimosVideos } from "@/features/loja/youtube";

export default async function HomePage() {
  const [destaques, recentes, videos] = await Promise.all([
    listProdutosDestaque(8),
    listProdutosPublicos({ pagina: 1, porPagina: 8 }),
    getUltimosVideos(CONTATO.youtube.channelId, 3),
  ]);

  return (
    <div>
      <Hero />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-12">
        {destaques.length > 0 ? (
          <section className="flex flex-col gap-4">
            <header className="flex items-end justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                Destaques
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/produtos">
                  Ver tudo <ArrowRightIcon className="ml-1 size-4" />
                </Link>
              </Button>
            </header>
            <ProdutoGrid produtos={destaques} />
          </section>
        ) : null}

        <CanalYouTube videos={videos} />

        {recentes.items.length > 0 ? (
          <section className="flex flex-col gap-4">
            <header className="flex items-end justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                {destaques.length > 0 ? "Mais produtos" : "Catálogo"}
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/produtos">
                  Ver tudo <ArrowRightIcon className="ml-1 size-4" />
                </Link>
              </Button>
            </header>
            <ProdutoGrid produtos={recentes.items} />
          </section>
        ) : (
          <p className="rounded-md border bg-card p-6 text-center text-muted-foreground">
            Pedro está organizando o catálogo. Volte em breve ou{" "}
            <a
              href={CONTATO.whatsapp.href}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              fale no WhatsApp
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
