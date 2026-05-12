import { ArrowRightIcon, PlayIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CONTATO } from "../../contato";
import type { VideoYoutube } from "../../youtube";

const dataFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function CanalYouTube({ videos }: { videos: VideoYoutube[] }) {
  if (videos.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Pedro no YouTube
          </h2>
          <p className="text-sm text-muted-foreground">
            Bastidores, reviews e tunagem de Volkswagen TSI/MSI.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a
            href={CONTATO.youtube.canal}
            target="_blank"
            rel="noreferrer"
            aria-label={`Visitar canal ${CONTATO.youtube.handle} no YouTube`}
          >
            Ver canal <ArrowRightIcon className="ml-1 size-4" />
          </a>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-2 rounded-lg border bg-card transition-colors hover:border-red-300"
          >
            <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnail}
                alt={video.titulo}
                className="size-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/30">
                <span className="grid size-12 place-items-center rounded-full bg-red-600/95 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                  <PlayIcon className="size-5 translate-x-px fill-current" />
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-3">
              <h3 className="line-clamp-2 text-sm font-medium leading-snug">
                {video.titulo}
              </h3>
              <time
                dateTime={video.publicadoEm}
                className="text-xs text-muted-foreground"
              >
                {dataFormatter.format(new Date(video.publicadoEm))}
              </time>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
