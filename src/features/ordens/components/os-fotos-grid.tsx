"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSupabaseSignedUrl } from "@/shared/hooks/use-supabase-signed-url";
import { removeFoto } from "../actions";
import { OS_FOTOS_BUCKET } from "../constants";
import { MOMENTO_LABEL, type FotoMomento, type OsFoto } from "../types";

function FotoCard({ foto, onRemoved }: { foto: OsFoto; onRemoved: (id: string) => void }) {
  const { url, loading } = useSupabaseSignedUrl(OS_FOTOS_BUCKET, foto.storage_path);
  const [pending, startTransition] = React.useTransition();

  function handleRemove() {
    if (!confirm("Remover esta foto?")) return;
    startTransition(async () => {
      const r = await removeFoto(foto.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      onRemoved(foto.id);
    });
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
      {url ? (
        <Image
          src={url}
          alt={foto.legenda ?? "Foto da OS"}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
          {loading ? "Carregando..." : "Sem prévia"}
        </div>
      )}
      <Button
        type="button"
        size="icon"
        variant="destructive"
        onClick={handleRemove}
        disabled={pending}
        aria-label="Remover foto"
        className="absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2Icon className="size-3" />
      </Button>
    </div>
  );
}

export function OsFotosGrid({ fotos }: { fotos: OsFoto[] }) {
  const [items, setItems] = React.useState(fotos);

  React.useEffect(() => setItems(fotos), [fotos]);

  function handleRemoved(id: string) {
    setItems((curr) => curr.filter((f) => f.id !== id));
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma foto. Use o botão acima para adicionar.
      </p>
    );
  }

  const grupos: Record<FotoMomento, OsFoto[]> = {
    entrada: [],
    saida: [],
    durante: [],
  };
  for (const foto of items) grupos[foto.momento].push(foto);

  return (
    <div className="flex flex-col gap-4">
      {(["entrada", "durante", "saida"] as FotoMomento[]).map((m) => {
        if (grupos[m].length === 0) return null;
        return (
          <section key={m} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{MOMENTO_LABEL[m]}</h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {grupos[m].map((f) => (
                <FotoCard key={f.id} foto={f} onRemoved={handleRemoved} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
