import { LANDING_DEPOIMENTOS } from "../../landing-stats";

export function Depoimentos() {
  return (
    <section className="dark relative bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <span className="eyebrow">§ QUEM JÁ PASSOU</span>
          <h2 className="text-display text-3xl uppercase leading-tight md:text-4xl">
            Confiança vem pelo carro
          </h2>
        </div>

        <ul className="mt-8 grid gap-px bg-white/10 md:mt-10 md:grid-cols-3">
          {LANDING_DEPOIMENTOS.map((dep) => (
            <li
              key={`${dep.autor}-${dep.carro}`}
              className="flex flex-col gap-4 bg-neutral-950 p-6 md:p-8"
            >
              <p className="flex-1 text-sm leading-relaxed text-white/85 md:text-base">
                {dep.texto}
              </p>
              <div className="flex items-baseline justify-between gap-2 border-t border-white/10 pt-3">
                <span className="text-display text-sm uppercase tracking-tight text-white md:text-base">
                  {dep.autor}
                </span>
                <span className="text-num text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--accent-red)]">
                  {dep.carro}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
