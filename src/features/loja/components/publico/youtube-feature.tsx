import { ArrowRightIcon, PlayIcon } from "lucide-react";

import { CONTATO } from "../../contato";
import type { VideoYoutube } from "../../youtube";

const dataFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function YouTubeFeature({ videos }: { videos: VideoYoutube[] }) {
  if (videos.length === 0) return null;

  const [featured, ...secundarios] = videos;
  const lista = secundarios.slice(0, 3);

  return (
    <section className="dark relative bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-12">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">§ NO YOUTUBE · {CONTATO.youtube.handle}</span>
            <h2 className="text-display text-5xl uppercase leading-[0.85] md:text-6xl lg:text-7xl">
              Pedro testa,
              <br />
              <span className="text-[color:var(--accent-red)]">mostra</span> e
              ensina
            </h2>
          </div>
          <a
            href={CONTATO.youtube.canal}
            target="_blank"
            rel="noreferrer"
            className="text-display inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white transition-colors hover:text-[color:var(--accent-red)]"
          >
            Ver canal completo
            <ArrowRightIcon className="size-4" />
          </a>
        </header>

        <div className="grid gap-px bg-white/10 lg:grid-cols-[1.6fr_1fr]">
          {featured ? (
            <a
              href={featured.url}
              target="_blank"
              rel="noreferrer"
              className="group relative flex flex-col bg-neutral-950"
            >
              <div className="relative aspect-video overflow-hidden bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.thumbnail}
                  alt={featured.titulo}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/30" />
                <span className="absolute left-6 top-6 inline-flex items-center gap-2 bg-[color:var(--accent-red)] px-3 py-1 text-display text-[0.7rem] uppercase tracking-[0.2em] text-white">
                  Em destaque
                </span>
                <span className="absolute bottom-6 right-6 grid size-16 place-items-center rounded-full bg-[color:var(--accent-red)] text-white shadow-lg transition-transform duration-300 group-hover:scale-110 md:size-20">
                  <PlayIcon className="size-7 translate-x-0.5 fill-current md:size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-3 p-6 md:p-10">
                <time
                  dateTime={featured.publicadoEm}
                  className="text-num text-xs uppercase tracking-[0.18em] text-white/55"
                >
                  {dataFormatter.format(new Date(featured.publicadoEm))}
                </time>
                <h3 className="text-display line-clamp-3 text-2xl uppercase leading-tight transition-colors group-hover:text-[color:var(--accent-red)] md:text-4xl">
                  {featured.titulo}
                </h3>
              </div>
            </a>
          ) : null}

          {lista.length > 0 ? (
            <ul className="flex flex-col gap-px bg-white/10">
              {lista.map((video) => (
                <li key={video.id} className="flex flex-1 bg-neutral-950">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex w-full items-stretch gap-4 p-4 transition-colors hover:bg-white/[0.04] md:gap-5 md:p-6"
                  >
                    <div className="relative aspect-video w-32 flex-none overflow-hidden bg-neutral-900 md:w-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={video.thumbnail}
                        alt={video.titulo}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                      <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <PlayIcon className="size-6 fill-current text-white" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                      <time
                        dateTime={video.publicadoEm}
                        className="text-num text-[0.65rem] uppercase tracking-[0.18em] text-white/55"
                      >
                        {dataFormatter.format(new Date(video.publicadoEm))}
                      </time>
                      <h3 className="text-display line-clamp-2 text-base uppercase leading-tight transition-colors group-hover:text-[color:var(--accent-red)] md:text-xl">
                        {video.titulo}
                      </h3>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
