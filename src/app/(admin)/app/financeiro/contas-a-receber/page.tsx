import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContasReceberTable } from "@/features/financeiro/components/contas-receber-table";
import { listContasAReceber } from "@/features/financeiro/queries";

export default async function ContasAReceberPage() {
  const rows = await listContasAReceber();

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
          Contas a receber
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} cliente{rows.length === 1 ? "" : "s"} com parcelas em aberto
        </p>
      </header>
      <ContasReceberTable rows={rows} />
    </div>
  );
}
