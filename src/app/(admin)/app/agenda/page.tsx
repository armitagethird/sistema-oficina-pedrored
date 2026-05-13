import Link from "next/link";
import { CalendarDays, CalendarRange, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaHoje } from "@/features/agenda/components/AgendaHoje";

export default async function AgendaPage() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Agenda</h1>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/agenda/semana">
              <CalendarDays className="size-4" />
              Semana
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/agenda/mes">
              <CalendarRange className="size-4" />
              Mês
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/agenda/configuracoes">
              <Settings className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
      <AgendaHoje />
    </div>
  );
}
