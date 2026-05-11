import { GaugeIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VeiculoKmRegistro } from "../queries";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

export function KmTimeline({
  registros,
  className,
}: {
  registros: VeiculoKmRegistro[];
  className?: string;
}) {
  if (registros.length === 0) {
    return (
      <div className={cn("rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground", className)}>
        Nenhum registro de KM ainda.
      </div>
    );
  }

  return (
    <ol className={cn("flex flex-col gap-2", className)}>
      {registros.map((r, i) => (
        <li
          key={`${r.os_id}-${r.data}-${i}`}
          className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm"
        >
          <GaugeIcon className="size-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">
              {r.km.toLocaleString("pt-BR")} km
            </p>
            <p className="text-xs text-muted-foreground">
              OS #{r.os_numero} · {dateFormatter.format(new Date(r.data))}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
