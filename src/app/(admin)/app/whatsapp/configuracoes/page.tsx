import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappConfigForm } from "@/features/whatsapp/components/config-form";
import { KillSwitchToggle } from "@/features/whatsapp/components/kill-switch-toggle";
import { getConfig, listJobsRecentes } from "@/features/whatsapp/queries";
import { JOB_LABEL } from "@/features/whatsapp/types";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ConfigWhatsappPage() {
  const [config, jobs] = await Promise.all([
    getConfig(),
    listJobsRecentes(20),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/whatsapp">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configurações do WhatsApp
        </h1>
        <p className="text-sm text-muted-foreground">
          Kill-switch global e ajustes do lembrete de óleo
        </p>
      </header>

      <KillSwitchToggle defaultAtivo={config.envios_ativos} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lembrete de óleo (km)</CardTitle>
        </CardHeader>
        <CardContent>
          <WhatsappConfigForm
            defaults={{
              oleo_km_intervalo: config.oleo_km_intervalo,
              oleo_km_antecedencia: config.oleo_km_antecedencia,
              oleo_km_dia: config.oleo_km_dia,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de jobs cron</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum job registrado ainda. Eles aparecem aqui após o primeiro
              disparo do cron.
            </p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div>
                    <p className="font-medium">{JOB_LABEL[job.tipo]}</p>
                    <p className="text-xs text-muted-foreground">
                      Marco: {job.marco} · {dateFormatter.format(new Date(job.criado_em))}
                    </p>
                  </div>
                  <span
                    className={
                      job.sucesso
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                        : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-200"
                    }
                  >
                    {job.sucesso ? "Enviado" : job.erro ?? "Falhou"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
