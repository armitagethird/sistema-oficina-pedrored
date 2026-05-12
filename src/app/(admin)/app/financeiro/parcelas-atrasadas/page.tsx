import Link from "next/link";
import {
  AlertTriangleIcon,
  CalendarIcon,
  ChevronLeftIcon,
  PhoneIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ParcelaStatusBadge } from "@/features/financeiro/components/parcela-status-badge";
import { listParcelasAtrasadas } from "@/features/financeiro/queries";
import { PAGAMENTO_METODO_LABEL } from "@/features/financeiro/types";
import { formatBRL } from "@/shared/format/money";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

function diasAtraso(dataPrevista: string | null): number {
  if (!dataPrevista) return 0;
  const prev = new Date(`${dataPrevista}T12:00:00`).getTime();
  const hoje = Date.now();
  return Math.max(0, Math.floor((hoje - prev) / (1000 * 60 * 60 * 24)));
}

export default async function ParcelasAtrasadasPage() {
  const parcelas = await listParcelasAtrasadas();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/financeiro">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>
      <header>
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-6 text-red-700 dark:text-red-300" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Parcelas atrasadas
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {parcelas.length} parcela{parcelas.length === 1 ? "" : "s"} vencida
          {parcelas.length === 1 ? "" : "s"}
        </p>
      </header>

      {parcelas.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          Nenhuma parcela atrasada. Tudo em dia.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {parcelas.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{formatBRL(p.valor)}</span>
                  <ParcelaStatusBadge status={p.status} />
                  <span className="text-xs text-muted-foreground">
                    {PAGAMENTO_METODO_LABEL[p.metodo]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="size-3" />
                  Previsto: {formatDate(p.data_prevista)} ·{" "}
                  <span className="font-medium text-red-700 dark:text-red-300">
                    {diasAtraso(p.data_prevista)} dia
                    {diasAtraso(p.data_prevista) === 1 ? "" : "s"} de atraso
                  </span>
                </p>
                {p.os ? (
                  <p className="text-xs text-muted-foreground">
                    OS #{p.os.numero}
                    {p.os.cliente ? ` · ${p.os.cliente.nome}` : ""}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {p.os?.cliente?.telefone ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${p.os.cliente.telefone}`}>
                      <PhoneIcon className="mr-1 size-4" />
                      {p.os.cliente.telefone}
                    </a>
                  </Button>
                ) : null}
                {p.os ? (
                  <Button asChild size="sm">
                    <Link href={`/app/os/${p.os.id}`}>Ver OS</Link>
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
