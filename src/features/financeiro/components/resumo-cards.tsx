import Link from "next/link";
import {
  AlertTriangleIcon,
  HourglassIcon,
  PiggyBankIcon,
  WalletIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/shared/format/money";
import type { ResumoFinanceiro } from "../queries";

type CardData = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: typeof WalletIcon;
  emphasis?: "default" | "warning" | "danger";
};

export function ResumoCards({ resumo }: { resumo: ResumoFinanceiro }) {
  const cards: CardData[] = [
    {
      label: "Total a receber",
      value: formatBRL(resumo.total_a_receber),
      hint: "Pendente + atrasado",
      href: "/app/financeiro/contas-a-receber",
      icon: WalletIcon,
    },
    {
      label: "Total atrasado",
      value: formatBRL(resumo.total_atrasado),
      hint: `${resumo.parcelas_atrasadas} parcela${resumo.parcelas_atrasadas === 1 ? "" : "s"}`,
      href: "/app/financeiro/parcelas-atrasadas",
      icon: AlertTriangleIcon,
      emphasis: resumo.total_atrasado > 0 ? "danger" : "default",
    },
    {
      label: "Capital investido",
      value: formatBRL(resumo.capital_investido),
      hint: "Pedidos não compensados",
      href: "/app/financeiro/capital-investido",
      icon: PiggyBankIcon,
    },
    {
      label: "Parcelas em aberto",
      value: String(resumo.parcelas_atrasadas + Math.max(0, 0)),
      hint: "Aguardando pagamento",
      href: "/app/financeiro/contas-a-receber",
      icon: HourglassIcon,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link key={c.label} href={c.href} className="block">
            <Card
              className={cn(
                "transition-colors hover:bg-accent",
                c.emphasis === "danger" &&
                  "border-red-200 dark:border-red-900",
              )}
            >
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {c.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xl font-semibold tabular-nums truncate",
                      c.emphasis === "danger" &&
                        "text-red-700 dark:text-red-300",
                    )}
                  >
                    {c.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.hint}</p>
                </div>
                <div
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground",
                    c.emphasis === "danger" &&
                      "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
