import Link from "next/link";
import { MapPinIcon } from "lucide-react";

import { CarrinhoIndicator } from "@/features/loja/components/publico/carrinho-indicator";
import {
  InstagramIcon,
  YoutubeIcon,
} from "@/features/loja/components/publico/social-icons";
import {
  CONTATO,
  getEnderecoCompleto,
  getMapsUrl,
} from "@/features/loja/contato";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ano = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/85 text-white backdrop-blur-md supports-[backdrop-filter]:bg-neutral-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
          <Link
            href="/"
            aria-label="PedroRed — página inicial"
            className="group flex items-baseline gap-1 leading-none"
          >
            <span className="text-display text-3xl text-white md:text-[2.25rem]">
              PEDRO
            </span>
            <span className="text-display text-3xl text-[color:var(--accent-red)] transition-colors group-hover:text-white md:text-[2.25rem]">
              RED
            </span>
            <span className="eyebrow ml-4 hidden self-center text-white/55 md:inline">
              TSI / MSI SPECIALIST
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/produtos"
              className="text-display text-sm uppercase tracking-[0.18em] text-white/85 transition-colors hover:text-white"
            >
              Catálogo
            </Link>
            <a
              href={CONTATO.youtube.canal}
              target="_blank"
              rel="noreferrer"
              aria-label="Canal do PedroRed no YouTube"
              className="text-white/75 transition-colors hover:text-[color:var(--accent-red)]"
            >
              <YoutubeIcon className="size-5" />
            </a>
            <a
              href={CONTATO.instagram.url}
              target="_blank"
              rel="noreferrer"
              aria-label="PedroRed no Instagram"
              className="text-white/75 transition-colors hover:text-white"
            >
              <InstagramIcon className="size-5" />
            </a>
            <CarrinhoIndicator />
            <a
              href={CONTATO.whatsapp.href}
              target="_blank"
              rel="noreferrer"
              className="text-display hidden items-center gap-2 border-2 border-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black sm:inline-flex"
            >
              Falar no Whats
              <span aria-hidden>▸</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="dark relative overflow-hidden border-t-[3px] border-[color:var(--accent-red)] bg-zinc-950 text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('/boviqvswi4001.png')] bg-[length:300px_300px] bg-repeat opacity-30 blur-[1px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
            <div className="flex flex-col gap-6">
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-display text-5xl text-white md:text-6xl">
                  PEDRO
                </span>
                <span className="text-display text-5xl text-[color:var(--accent-red)] md:text-6xl">
                  RED
                </span>
              </div>
              <p className="max-w-md text-base leading-relaxed text-foreground/85">
                Peças e serviços para linha Volkswagen TSI/MSI. Selecionado pelo
                mecânico que entende do seu carro.
              </p>
              <span className="eyebrow text-foreground/60">
                § ESTÚDIO TSI / MSI · SÃO LUÍS / MA
              </span>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <span className="eyebrow">§01 · VISITE A OFICINA</span>
              <a
                href={getMapsUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-3 leading-relaxed text-foreground/85 transition-colors hover:text-white"
              >
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                <span>{getEnderecoCompleto()}</span>
              </a>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <span className="eyebrow">§02 · CONECTE-SE</span>
              <a
                href={CONTATO.whatsapp.href}
                target="_blank"
                rel="noreferrer"
                className="text-display text-lg uppercase tracking-[0.16em] text-white transition-colors hover:text-[color:var(--accent-red)]"
              >
                {CONTATO.whatsapp.label} ▸
              </a>
              <a
                href={CONTATO.youtube.canal}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-foreground/85 transition-colors hover:text-white"
              >
                <YoutubeIcon className="size-4" />
                YouTube {CONTATO.youtube.handle}
              </a>
              <a
                href={CONTATO.instagram.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-foreground/85 transition-colors hover:text-white"
              >
                <InstagramIcon className="size-4" />
                Instagram {CONTATO.instagram.handle}
              </a>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[0.7rem] uppercase tracking-[0.14em] text-foreground/60 md:flex-row md:items-center md:justify-between md:px-8">
            <p className="text-num">
              © {ano} PEDROred · Todos os direitos reservados
            </p>
            <p>
              Feito por{" "}
              <a
                href={CONTATO.creditoDev.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground/85 transition-colors hover:text-[color:var(--accent-red)]"
              >
                {CONTATO.creditoDev.nome}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
