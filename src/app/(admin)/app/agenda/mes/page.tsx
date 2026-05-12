import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaMesCalendario } from "@/features/agenda/components/AgendaMesCalendario";

interface Props {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}

export default async function AgendaMesPage({ searchParams }: Props) {
  const { ano: anoStr, mes: mesStr } = await searchParams;
  const hoje = new Date();
  const ano = parseInt(anoStr ?? String(hoje.getFullYear()), 10);
  const mes = parseInt(mesStr ?? String(hoje.getMonth() + 1), 10);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Hoje
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Calendário</h1>
      </div>
      <AgendaMesCalendario ano={ano} mes={mes} />
    </div>
  );
}
