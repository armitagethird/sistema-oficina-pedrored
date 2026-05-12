import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaSemana } from "@/features/agenda/components/AgendaSemana";

interface Props {
  searchParams: Promise<{ offset?: string }>;
}

export default async function AgendaSemanaPage({ searchParams }: Props) {
  const { offset } = await searchParams;
  const semanaOffset = parseInt(offset ?? "0", 10);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Hoje
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Semana</h1>
      </div>
      <AgendaSemana semanaOffset={semanaOffset} />
    </div>
  );
}
