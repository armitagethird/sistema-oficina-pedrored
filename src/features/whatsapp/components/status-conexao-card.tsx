import { CheckCircle2Icon, RefreshCwIcon, XCircleIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { EvolutionConnectionState } from "../evolution-client";

type StatusInput =
  | { configured: false }
  | { configured: true; state: EvolutionConnectionState };

interface Props {
  status: StatusInput;
}

const META: Record<
  EvolutionConnectionState | "nao_configurado",
  { label: string; tom: "ok" | "alerta" | "erro"; Icon: typeof CheckCircle2Icon }
> = {
  open: { label: "Conectado", tom: "ok", Icon: CheckCircle2Icon },
  connecting: { label: "Conectando", tom: "alerta", Icon: RefreshCwIcon },
  close: { label: "Desconectado", tom: "erro", Icon: XCircleIcon },
  unknown: { label: "Sem resposta", tom: "alerta", Icon: XCircleIcon },
  nao_configurado: {
    label: "Não configurado",
    tom: "erro",
    Icon: XCircleIcon,
  },
};

const TOM_CLASSES: Record<"ok" | "alerta" | "erro", string> = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  alerta:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  erro: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200",
};

export function StatusConexaoCard({ status }: Props) {
  const key = !status.configured ? "nao_configurado" : status.state;
  const meta = META[key];
  const Icon = meta.Icon;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Status Evolution API
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "grid size-10 place-items-center rounded-full",
              TOM_CLASSES[meta.tom],
            )}
          >
            <Icon className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-semibold">{meta.label}</p>
            <p className="text-xs text-muted-foreground">
              {!status.configured
                ? "Variáveis EVOLUTION_API_URL/KEY/INSTANCE não configuradas"
                : "Instância pareada à Evolution API"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
