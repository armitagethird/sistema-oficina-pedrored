import { ArrowRightIcon } from "lucide-react";

import { CONTATO } from "../../contato";
import { LANDING_SERVICOS } from "../../landing-stats";

export function ServicosBlock() {
  return (
    <section className="relative bg-[color:var(--paper)] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="eyebrow">§ POR QUE PEDRO</span>
          <a
            href={CONTATO.whatsapp.href}
            target="_blank"
            rel="noreferrer"
            className="text-display inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-zinc-900 transition-colors hover:text-[color:var(--accent-red)]"
          >
            Agendar pelo WhatsApp
            <ArrowRightIcon className="size-4" />
          </a>
        </div>

        <div className="mt-8 grid gap-px bg-zinc-200 md:mt-10 md:grid-cols-[1.4fr_1fr]">
          <article className="flex flex-col gap-4 bg-[color:var(--paper)] p-7 md:gap-5 md:p-10">
            <span className="text-display text-num text-6xl leading-none text-[color:var(--accent-red)] md:text-7xl lg:text-8xl">
              00
            </span>
            <h3 className="text-display text-2xl uppercase leading-[0.95] md:text-3xl lg:text-4xl">
              Última instância
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-zinc-700 md:text-base">
              Quando outras oficinas desistem, o carro vem pra cá. Pedro é
              referência regional em diagnósticos que ninguém resolveu — motor
              TSI/MSI, eletrônica e casos crônicos.
            </p>
          </article>

          <div className="grid grid-rows-2 gap-px bg-zinc-200">
            {LANDING_SERVICOS.map((servico) => (
              <article
                key={servico.numero}
                className="flex items-start gap-4 bg-[color:var(--paper)] p-5 md:p-6"
              >
                <span className="text-display text-num shrink-0 text-3xl leading-none text-[color:var(--accent-red)] md:text-4xl">
                  {servico.numero}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h4 className="text-display text-base uppercase leading-tight md:text-lg">
                    {servico.titulo}
                  </h4>
                  <p className="text-xs leading-relaxed text-zinc-600 md:text-sm">
                    {servico.descricao}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
