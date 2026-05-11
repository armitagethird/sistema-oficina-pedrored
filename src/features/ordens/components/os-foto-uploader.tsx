"use client";

import * as React from "react";
import { toast } from "sonner";
import { CameraIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadFoto } from "../actions";
import {
  FOTO_MOMENTO_VALUES,
  MOMENTO_LABEL,
  type FotoMomento,
} from "../types";

export function OsFotoUploader({ osId }: { osId: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [momento, setMomento] = React.useState<FotoMomento>("entrada");
  const [pending, startTransition] = React.useTransition();

  function trigger() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("momento", momento);

    startTransition(async () => {
      const r = await uploadFoto(osId, fd);
      if (!r.ok) {
        toast.error(r.error);
      } else {
        toast.success("Foto enviada");
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Momento</label>
        <Select
          value={momento}
          onValueChange={(v) => setMomento(v as FotoMomento)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOTO_MOMENTO_VALUES.map((m) => (
              <SelectItem key={m} value={m}>
                {MOMENTO_LABEL[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="button" onClick={trigger} disabled={pending}>
        <CameraIcon className="mr-1 size-4" />
        {pending ? "Enviando..." : "Tirar foto"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
