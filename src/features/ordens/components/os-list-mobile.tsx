import Link from "next/link";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBRL } from "@/shared/format/money";
import type { OSListItem } from "../queries";
import { OsStatusBadge } from "./os-status-badge";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function descreveVeiculoCurto(v: OSListItem["veiculo"]): string {
  const modelo = v?.vw_modelo
    ? `${v.vw_modelo.modelo} ${v.vw_modelo.motor}`
    : v?.modelo_custom ?? "—";
  const ano = v?.ano ? ` ${v.ano}` : "";
  const placa = v?.placa ? ` (${v.placa})` : "";
  return `${modelo}${ano}${placa}`;
}

export function OsListMobile({
  items,
  className,
}: {
  items: OSListItem[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((os) => (
        <li key={os.id}>
          <Link
            href={`/app/os/${os.id}`}
            className="flex flex-col gap-2 rounded-md border bg-card p-3 transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                OS #{os.numero} · {os.cliente?.nome ?? "—"}
              </p>
              <OsStatusBadge status={os.status} />
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {descreveVeiculoCurto(os.veiculo)}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {dateFormatter.format(new Date(os.criado_em))}
              </span>
              <span className="font-medium text-foreground">
                {formatBRL(os.total_geral)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
