import Link from "next/link";
import {
  ChevronLeftIcon,
  ListIcon,
  MessageCircleIcon,
  Settings2Icon,
  StickyNoteIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusConexaoCard } from "@/features/whatsapp/components/status-conexao-card";
import { getConfig, getMetricasEnvio } from "@/features/whatsapp/queries";
import { getStatusConexao } from "@/features/whatsapp/sender";

export const dynamic = "force-dynamic";

export default async function WhatsappDashboardPage() {
  const [config, metricas, statusEvolution] = await Promise.all([
    getConfig(),
    getMetricasEnvio(),
    getStatusConexao(),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/mais">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Mensagens automáticas e manuais para clientes
        </p>
      </header>

      <StatusConexaoCard
        status={
          statusEvolution
            ? { configured: true, state: statusEvolution.state }
            : { configured: false }
        }
      />

      {!config.envios_ativos && (
        <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm">
            <strong>Envios pausados.</strong> Reative em{" "}
            <Link
              href="/app/whatsapp/configuracoes"
              className="font-medium underline"
            >
              Configurações
            </Link>
            {" "}para liberar crons e mensagens manuais.
          </CardContent>
        </Card>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Enviadas hoje" value={metricas.hoje_enviadas} />
        <KpiCard
          label="Falharam hoje"
          value={metricas.hoje_falharam}
          tone={metricas.hoje_falharam > 0 ? "erro" : undefined}
        />
        <KpiCard label="Enviadas (7d)" value={metricas.semana_enviadas} />
        <KpiCard label="Recebidas (7d)" value={metricas.total_recebidas_7d} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <LinkCard
          href="/app/whatsapp/conversas"
          icon={MessageCircleIcon}
          title="Conversas"
          desc="Mensagens recebidas e enviadas"
        />
        <LinkCard
          href="/app/whatsapp/templates"
          icon={StickyNoteIcon}
          title="Templates"
          desc="Editar mensagens automáticas"
        />
        <LinkCard
          href="/app/whatsapp/configuracoes"
          icon={Settings2Icon}
          title="Configurações"
          desc="Kill-switch e intervalos de óleo"
        />
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <ListIcon className="size-4" />
            Crons agendados
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <ul className="flex flex-col gap-1">
            <li>Lembrete D-1 — 18:00 BRT diário</li>
            <li>Cobrança parcelas atrasadas — 10:00 BRT diário</li>
            <li>Lembrete óleo (km) — 11:00 BRT toda segunda</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "erro";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={
          tone === "erro"
            ? "text-3xl font-semibold text-red-600 dark:text-red-400"
            : "text-3xl font-semibold"
        }
      >
        {value}
      </CardContent>
    </Card>
  );
}

function LinkCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof ListIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-accent">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
