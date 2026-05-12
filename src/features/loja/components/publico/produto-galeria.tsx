"use client";

import * as React from "react";
import { PackageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProdutoGaleria({
  fotos,
  alt,
}: {
  fotos: string[];
  alt: string;
}) {
  const [ativa, setAtiva] = React.useState(0);
  if (fotos.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-lg border bg-muted text-muted-foreground">
        <PackageIcon className="size-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[ativa]}
          alt={alt}
          className="size-full object-contain"
          loading="lazy"
        />
      </div>
      {fotos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {fotos.map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setAtiva(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-md border transition-colors",
                i === ativa
                  ? "border-red-500 ring-2 ring-red-500/30"
                  : "border-muted",
              )}
              aria-label={`Foto ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
