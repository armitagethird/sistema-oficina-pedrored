import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b">
      <Image
        src="/pedrored-hero.jpg"
        alt="Pedro, mecânico responsável pela PedroRed"
        fill
        sizes="100vw"
        priority
        className="absolute inset-0 -z-20 object-cover object-[center_30%] md:object-[right_center]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/85 to-background/30 md:bg-gradient-to-r md:from-background md:via-background/80 md:to-transparent"
      />
      <div className="mx-auto flex min-h-[520px] max-w-6xl flex-col justify-end gap-3 px-4 py-12 md:min-h-[480px] md:justify-center md:px-6 md:py-16">
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
              <a href="https://wa.me/55" target="_blank" rel="noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
