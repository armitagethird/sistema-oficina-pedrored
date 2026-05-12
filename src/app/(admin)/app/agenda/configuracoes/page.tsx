import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSettingsCapacidade } from "@/features/agenda/queries";
import { CapacidadeConfig } from "@/features/agenda/components/CapacidadeConfig";

export default async function AgendaConfiguracoesPage() {
  const capacidade = await getSettingsCapacidade();

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/agenda">
            <ChevronLeft className="size-4" />
            Agenda
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Configurações da Agenda</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" />
            Capacidade padrão
          </CardTitle>
          <CardDescription>
            Número máximo de agendamentos por período. Pode ser sobrescrito por
            dia específico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CapacidadeConfig
            capacidadeManha={capacidade.manha}
            capacidadeTarde={capacidade.tarde}
          />
        </CardContent>
      </Card>
    </div>
  );
}
