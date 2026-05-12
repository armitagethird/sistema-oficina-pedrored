import Link from "next/link";
import { ArrowRightIcon, WrenchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-br from-red-50 via-background to-background dark:from-red-950/20">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6 md:py-16">
        <div className="flex flex-col gap-3 md:max-w-xl">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <WrenchIcon className="size-3" />
            Especialista linha VW TSI/MSI
          </span>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Peças e materiais selecionados pelo mecânico.
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Compre direto com Pedro — entrega rápida na cidade, retira na
            oficina, e suporte no WhatsApp pra tirar dúvida antes da compra.
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
