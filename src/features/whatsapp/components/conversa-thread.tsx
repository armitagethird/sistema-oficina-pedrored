import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";

import { STATUS_LABEL, type WhatsappMsg } from "../types";

interface Props {
  mensagens: WhatsappMsg[];
}

export function ConversaThread({ mensagens }: Props) {
  if (mensagens.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhuma mensagem ainda.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {mensagens.map((msg) => {
        const outgoing = msg.direcao === "out";
        return (
          <li
            key={msg.id}
            className={cn(
              "flex flex-col gap-1",
              outgoing ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                outgoing
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {format(new Date(msg.criado_em), "dd/MM HH:mm", { locale: ptBR })}
              {outgoing && (
                <>
                  {" · "}
                  <span
                    className={cn(
                      msg.status === "falhou" && "text-red-600 dark:text-red-400",
                    )}
                  >
                    {STATUS_LABEL[msg.status]}
                  </span>
                  {msg.erro ? ` · ${msg.erro}` : ""}
                </>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
