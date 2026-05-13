import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTemplates } from "@/features/whatsapp/queries";
import { TEMPLATE_LABEL } from "@/features/whatsapp/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/whatsapp">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Edite o texto das mensagens automáticas. Placeholders entre{" "}
          <code>{`{{...}}`}</code>.
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {templates.map((t) => (
          <li key={t.tipo}>
            <Link href={`/app/whatsapp/templates/${t.tipo}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{TEMPLATE_LABEL[t.tipo]}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.template_texto}
                    </p>
                  </div>
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
