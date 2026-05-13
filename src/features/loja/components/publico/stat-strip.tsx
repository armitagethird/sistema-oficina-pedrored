import { LANDING_STATS } from "../../landing-stats";

export function StatStrip() {
  return (
    <section className="bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8 md:py-4 lg:py-5">
        <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-white/55 md:justify-between md:gap-x-12 md:text-sm md:tracking-[0.18em] lg:text-base">
          {LANDING_STATS.map((stat) => (
            <li
              key={stat.label}
              className="flex items-baseline gap-1.5 md:gap-3"
            >
              <span className="text-display text-num text-sm leading-none text-white md:text-3xl lg:text-4xl">
                {stat.value}
              </span>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
