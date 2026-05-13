import { ArrowRightIcon } from "lucide-react";

import {
  CONTATO,
  getEnderecoCompleto,
  getMapsEmbedUrl,
  getMapsUrl,
} from "../../contato";

export function MapaOficina() {
  const { logradouro, bairro, cidade, estado } = CONTATO.endereco;

  return (
    <section className="dark relative border-t border-white/10 bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">§ VISITE A OFICINA</span>
            <h2 className="text-display text-4xl uppercase leading-[0.9] md:text-5xl lg:text-6xl">
              {cidade}{" "}
              <span className="text-[color:var(--accent-red)]">
                / {estado}
              </span>
            </h2>
          </div>
          <a
            href={CONTATO.whatsapp.href}
            target="_blank"
            rel="noreferrer"
            className="text-display inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white transition-colors hover:text-[color:var(--accent-red)]"
          >
            Falar no WhatsApp
            <ArrowRightIcon className="size-4" />
          </a>
        </header>

        <a
          href={getMapsUrl()}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir endereço no Google Maps: ${getEnderecoCompleto()}`}
          className="group relative block aspect-[4/5] w-full overflow-hidden border-2 border-white/15 transition-colors hover:border-white/40 sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9]"
        >
          <iframe
            src={getMapsEmbedUrl()}
            title={`Mapa: ${getEnderecoCompleto()}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="pointer-events-none h-full w-full grayscale transition-[filter] duration-500 group-hover:grayscale-0"
            tabIndex={-1}
            aria-hidden
          />
          <span aria-hidden className="absolute inset-0" />

          <div className="absolute bottom-3 left-3 max-w-[min(75%,260px)] border border-white/15 bg-neutral-950/85 px-3 py-2 backdrop-blur md:bottom-6 md:left-6 md:max-w-[400px] md:px-6 md:py-5 lg:max-w-[440px]">
            <span className="eyebrow text-[0.6rem] text-white/55 md:text-[0.75rem]">
              § Endereço
            </span>
            <p className="mt-1 text-xs leading-snug text-white md:mt-2 md:text-lg md:leading-tight lg:text-xl">
              {logradouro}
              <br />
              {bairro} · {cidade}/{estado}
            </p>
            <span className="text-display mt-1.5 inline-flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-white/70 transition-colors group-hover:text-[color:var(--accent-red)] md:mt-3 md:gap-2 md:text-[0.8rem] md:tracking-[0.22em]">
              Abrir no Maps
              <ArrowRightIcon className="size-3 md:size-4" />
            </span>
          </div>
        </a>
      </div>
    </section>
  );
}
