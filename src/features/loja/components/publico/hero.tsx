import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CONTATO } from "../../contato";

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

export function Hero() {
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

      {/* Desktop: split panel — texto à esquerda, foto contida à direita */}
      <div className="hidden md:block">
        <div className="mx-auto grid max-w-6xl grid-cols-[1.1fr_0.9fr] items-center gap-10 px-6 py-16">
          <HeroContent />
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
        </div>
      </div>
    </section>
  );
}
