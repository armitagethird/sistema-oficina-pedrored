import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateForm } from "@/features/whatsapp/components/template-form";
import { getTemplate } from "@/features/whatsapp/queries";
import { TEMPLATE_LABEL, type WhatsappTemplateTipo } from "@/features/whatsapp/types";

export const dynamic = "force-dynamic";

const TEMPLATE_TIPOS: WhatsappTemplateTipo[] = [
  "lembrete_d1",
  "os_pronta",
  "cobranca_atraso_3",
  "cobranca_atraso_7",
  "cobranca_atraso_15",
  "lembrete_oleo_km",
  "manual",
];

type Params = Promise<{ tipo: string }>;

export default async function EditarTemplatePage({
  params,
}: {
  params: Params;
}) {
  const { tipo } = await params;
  if (!TEMPLATE_TIPOS.includes(tipo as WhatsappTemplateTipo)) notFound();

  const template = await getTemplate(tipo as WhatsappTemplateTipo);
  if (!template) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/whatsapp/templates">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {TEMPLATE_LABEL[template.tipo]}
        </h1>
        {template.descricao && (
          <p className="text-sm text-muted-foreground">{template.descricao}</p>
        )}
      </header>

      <Card>
        <CardContent className="p-4">
          <TemplateForm template={template} />
        </CardContent>
      </Card>
    </div>
  );
}
