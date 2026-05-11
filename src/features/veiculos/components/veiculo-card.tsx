import Link from "next/link";
import { CarIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { descreveVeiculo, type VeiculoComModelo } from "../types";

export function VeiculoCard({
  veiculo,
  className,
}: {
  veiculo: VeiculoComModelo;
  className?: string;
}) {
  return (
    <Link
      href={`/app/veiculos/${veiculo.id}`}
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-accent",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground shrink-0">
          <CarIcon className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <p className="font-medium truncate">{descreveVeiculo(veiculo)}</p>
          <p className="text-xs text-muted-foreground truncate">
            {veiculo.km_atual?.toLocaleString("pt-BR") ?? 0} km
            {veiculo.cor ? ` • ${veiculo.cor}` : ""}
          </p>
        </div>
      </div>
      <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
