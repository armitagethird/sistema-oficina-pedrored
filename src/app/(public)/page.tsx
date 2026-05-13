import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Depoimentos } from "@/features/loja/components/publico/depoimentos";
import { Hero } from "@/features/loja/components/publico/hero";
import { MapaOficina } from "@/features/loja/components/publico/mapa-oficina";
import { ProdutoCard } from "@/features/loja/components/publico/produto-card";
import { ProdutoGrid } from "@/features/loja/components/publico/produto-grid";
import { ServicosBlock } from "@/features/loja/components/publico/servicos-block";
import { StatStrip } from "@/features/loja/components/publico/stat-strip";
import { YouTubeFeature } from "@/features/loja/components/publico/youtube-feature";
import { CONTATO } from "@/features/loja/contato";
import {
  listProdutosDestaque,
  listProdutosPublicos,
} from "@/features/loja/queries";
import { getUltimosVideos } from "@/features/loja/youtube";

export default async function HomePage() {
  const [destaques, recentes, videos] = await Promise.all([
    listProdutosDestaque(5),
    listProdutosPublicos({ pagina: 1, porPagina: 8 }),
    getUltimosVideos(CONTATO.youtube.channelId, 4),
  ]);

  const [destaqueHero, ...destaquesSecundarios] = destaques;
  const destaquesGrid = destaquesSecundarios.slice(0, 4);

  return (
    <div>
      <Hero />
      <StatStrip />

      {destaqueHero ? (
        <section className="border-t border-[color:var(--hairline)] bg-background">
          <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 md:px-8 md:pb-20 md:pt-6">
            <header className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-10">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-display text-num text-xs uppercase tracking-[0.18em] text-foreground/45">
                    § 01
                  </span>
                  <span
                    aria-hidden
                    className="h-px w-10 bg-[color:var(--hairline)] md:w-12"
                  />
                  <span className="eyebrow">DESTAQUES DO CATÁLOGO</span>
                </div>
                <h2 className="text-display text-5xl uppercase leading-[0.85] md:text-6xl lg:text-7xl">
                  Selecionados
                  <br />
                  pelo Pedro
                </h2>
              </div>
              <Link
                href="/produtos"
                className="text-display inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:text-[color:var(--accent-red)]"
              >
                Ver catálogo completo
                <ArrowRightIcon className="size-4" />
              </Link>
            </header>

            <div className="grid grid-cols-2 gap-px bg-[color:var(--hairline)] md:grid-cols-4">
              <ProdutoCard produto={destaqueHero} featured />
              {destaquesGrid.map((p) => (
                <ProdutoCard key={p.id} produto={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ServicosBlock />

      <YouTubeFeature videos={videos} />

      {recentes.items.length > 0 ? (
        <section className="bg-[color:var(--paper)]">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
              <div className="flex flex-col gap-3">
                <span className="eyebrow">§ CATÁLOGO RECENTE</span>
                <h2 className="text-display text-4xl uppercase leading-[0.9] md:text-6xl">
                  Mais peças
                </h2>
              </div>
              <Link
                href="/produtos"
                className="text-display inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:text-[color:var(--accent-red)]"
              >
                Ver tudo
                <ArrowRightIcon className="size-4" />
              </Link>
            </header>
            <ProdutoGrid produtos={recentes.items} />
          </div>
        </section>
      ) : (
        <section className="bg-[color:var(--paper)]">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
            <p className="border border-[color:var(--hairline)] p-8 text-center text-muted-foreground">
              Pedro está organizando o catálogo. Volte em breve ou{" "}
              <a
                href={CONTATO.whatsapp.href}
                className="underline transition-colors hover:text-[color:var(--accent-red)]"
                target="_blank"
                rel="noreferrer"
              >
                fale no WhatsApp
              </a>
              .
            </p>
          </div>
        </section>
      )}

      <Depoimentos />

      <MapaOficina />
    </div>
  );
}
