import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CONTATO } from "../../contato";

const HERO_IMAGE = "/pedrored-hero.jpg";
const HERO_ALT = "Pedro, mecânico responsável pela PedroRed";

export function Hero() {
  return (
    <section className="dark relative isolate overflow-hidden bg-neutral-950 text-white">
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] md:aspect-[21/9] lg:aspect-[16/7] lg:max-h-[72dvh] xl:aspect-[16/7] xl:max-h-[74dvh]">
        <Image
          src={HERO_IMAGE}
          alt={HERO_ALT}
          fill
          sizes="100vw"
          priority
          className="object-cover object-[60%_22%] md:object-[72%_25%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent md:from-neutral-950/95 md:via-neutral-950/55 md:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent md:h-1/3"
        />

        <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end px-4 pb-6 md:justify-center md:px-8 md:pb-0">
          <div className="flex max-w-2xl flex-col gap-5 md:gap-7">
            <span className="eyebrow text-white/85">
              § PEDRORED · STORE
            </span>
            <h1 className="text-display text-[3rem] uppercase leading-[0.82] tracking-tight sm:text-6xl md:text-[4.5rem] lg:text-[6rem] xl:text-[7.5rem]">
              Pedro
              <br />
              <span className="text-[color:var(--accent-red)]">Red</span>
              <br />
              <span className="text-white/90">Store</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/85 md:text-lg">
              Peças selecionadas pelo seu mecânico favorito.
            </p>
            <div className="flex items-stretch gap-2 sm:gap-3">
              <Button
                asChild
                variant="editorial"
                size="lg"
                className="flex-1 rounded-none px-3 sm:flex-none sm:px-8"
              >
                <Link href="/produtos">
                  <span className="sm:hidden">Catálogo</span>
                  <span className="hidden sm:inline">Ver catálogo</span>
                  <ArrowRightIcon className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="editorial-outline"
                size="lg"
                className="flex-1 rounded-none px-3 sm:flex-none sm:px-8"
              >
                <a
                  href={CONTATO.whatsapp.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="sm:hidden">WhatsApp</span>
                  <span className="hidden sm:inline">Falar no WhatsApp</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
