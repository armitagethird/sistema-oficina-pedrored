import Link from "next/link";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  PiggyBankIcon,
  WalletIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraficoReceber30Dias } from "@/features/financeiro/components/grafico-receber-30dias";
import { ResumoCards } from "@/features/financeiro/components/resumo-cards";
import {
  getResumoFinanceiro,
  listPagamentos30Dias,
} from "@/features/financeiro/queries";

export default async function FinanceiroPage() {
  const [resumo, dias] = await Promise.all([
    getResumoFinanceiro(),
    listPagamentos30Dias(),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral de contas a receber, capital investido e próximos pagamentos.
        </p>
      </header>

      <ResumoCards resumo={resumo} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <GraficoReceber30Dias data={dias} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Button asChild variant="outline" className="justify-start" size="lg">
          <Link href="/app/financeiro/contas-a-receber">
            <WalletIcon className="mr-2 size-5" />
            <span className="flex-1 text-left">Contas a receber</span>
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start" size="lg">
          <Link href="/app/financeiro/parcelas-atrasadas">
            <AlertTriangleIcon className="mr-2 size-5" />
            <span className="flex-1 text-left">Parcelas atrasadas</span>
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start" size="lg">
          <Link href="/app/financeiro/capital-investido">
            <PiggyBankIcon className="mr-2 size-5" />
            <span className="flex-1 text-left">Capital investido</span>
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
