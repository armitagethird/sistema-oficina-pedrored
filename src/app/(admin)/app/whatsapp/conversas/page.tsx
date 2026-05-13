import Link from "next/link";
import { ChevronLeftIcon, MessageCircleIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listConversas } from "@/features/whatsapp/queries";

export const dynamic = "force-dynamic";

export default async function ConversasPage() {
  const conversas = await listConversas();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/whatsapp">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Conversas</h1>
        <p className="text-sm text-muted-foreground">
          {conversas.length} cliente(s) com mensagens
        </p>
      </header>

      {conversas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <MessageCircleIcon className="size-8 opacity-40" />
            Nenhuma conversa ainda. Quando uma mensagem for enviada ou recebida,
            ela aparecerá aqui.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {conversas.map((c) => {
            const href = c.cliente_id
              ? `/app/whatsapp/conversas/${c.cliente_id}`
              : `/app/whatsapp/conversas/telefone/${encodeURIComponent(c.telefone)}`;
            return (
              <li key={`${c.cliente_id ?? "tel"}-${c.telefone}`}>
                <Link href={href}>
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                        <MessageCircleIcon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {c.cliente_nome ?? c.telefone}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.ultima_direcao === "in" ? "↙ " : "↗ "}
                          {c.ultima_msg}
                        </p>
                      </div>
                      <div className="flex flex-col items-end text-[11px] text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(c.ultima_em), {
                            locale: ptBR,
                            addSuffix: true,
                          })}
                        </span>
                        <span>{c.total_msgs} msg(s)</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
