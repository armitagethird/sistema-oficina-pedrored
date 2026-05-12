import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CONTATO } from "../../contato";
import type { VideoYoutube } from "../../youtube";
import { VideoRow } from "./canal-youtube";

const HERO_IMAGE = "/pedrored-hero.jpg";
const HERO_ALT = "Pedro, mecânico responsável pela PedroRed";

function HeroContent() {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        <span className="text-foreground">Pedro</span>
        <span className="text-red-500">Red</span>
        <span className="text-foreground"> Store</span>
      </h1>
      <p className="text-base text-muted-foreground md:text-lg">
        Peças e materiais selecionados pelo seu mecânico favorito.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg">
          <Link href="/produtos">
            Ver catálogo
            <ArrowRightIcon className="ml-1 size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href={CONTATO.whatsapp.href} target="_blank" rel="noreferrer">
            Falar no WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}

export function Hero({ videos = [] }: { videos?: VideoYoutube[] }) {
  const videosNoHero = videos.slice(0, 3);

  return (
    <section className="border-b">
      {/* Mobile: full-bleed com foto de fundo + gradiente */}
      <div className="relative isolate overflow-hidden md:hidden">
        <Image
          src={HERO_IMAGE}
          alt={HERO_ALT}
          fill
          sizes="100vw"
          priority
          className="absolute inset-0 -z-20 object-cover object-[center_30%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/85 to-background/30"
        />
        <div className="mx-auto flex min-h-[520px] max-w-6xl flex-col justify-end px-4 py-12">
          <HeroContent />
        </div>
      </div>

      {/* Desktop: título full-width + grid foto/vídeos integrado */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-10">
            <HeroContent />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border bg-muted shadow-sm">
              <Image
                src={HERO_IMAGE}
                alt={HERO_ALT}
                fill
                sizes="(min-width: 1024px) 480px, 50vw"
                priority
                className="object-cover object-[center_15%]"
              />
            </div>

            {videosNoHero.length > 0 ? (
              <div className="flex flex-col gap-3">
                <header className="flex items-baseline justify-between gap-3">
                  <div className="flex flex-col">
                    <h2 className="text-base font-semibold tracking-tight">
                      Pedro no YouTube
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      Bastidores, reviews e tunagem TSI/MSI
                    </span>
                  </div>
                  <a
                    href={CONTATO.youtube.canal}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Ver canal <ArrowRightIcon className="size-4" />
                  </a>
                </header>
                <div className="flex flex-1 flex-col justify-between gap-3">
                  {videosNoHero.map((video) => (
                    <VideoRow key={video.id} video={video} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
