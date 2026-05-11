import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CapitalInvestidoTable } from "@/features/financeiro/components/capital-investido-table";
import { listCapitalInvestido } from "@/features/financeiro/queries";

export default async function CapitalInvestidoPage() {
  const rows = await listCapitalInvestido();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/financeiro">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Capital investido
        </h1>
        <p className="text-sm text-muted-foreground">
          Pedidos a fornecedor pagos por Pedro que ainda não foram compensados pelo
          cliente.
        </p>
      </header>
      <CapitalInvestidoTable rows={rows} />
    </div>
  );
}
