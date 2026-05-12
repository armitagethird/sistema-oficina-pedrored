import Link from "next/link";
import { ChevronRightIcon, FactoryIcon, PhoneIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Fornecedor } from "../types";

export function FornecedorCard({
  fornecedor,
  className,
}: {
  fornecedor: Fornecedor;
  className?: string;
}) {
  return (
    <Link
      href={`/app/fornecedores/${fornecedor.id}`}
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-accent",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground shrink-0">
          <FactoryIcon className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <p className="font-medium truncate">{fornecedor.nome}</p>
          {fornecedor.telefone ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <PhoneIcon className="size-3" />
              {fornecedor.telefone}
            </p>
          ) : null}
        </div>
      </div>
      <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
