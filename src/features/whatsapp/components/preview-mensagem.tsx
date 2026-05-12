"use client";

import { TemplateRenderError, renderTemplate } from "../templates";
import type { TemplateVars } from "../schemas";

interface Props {
  texto: string;
  vars: TemplateVars;
}

/**
 * Preview live de mensagem renderizada. Em modo "best effort" — quando
 * placeholders faltam, mostra a mensagem com substituições vazias para
 * não interromper o usuário enquanto digita.
 */
export function PreviewMensagem({ texto, vars }: Props) {
  let preview: string;
  let invalidos: string[] = [];
  let faltando: string[] = [];

  try {
    preview = renderTemplate(texto, vars, { strict: false });
  } catch (err) {
    if (err instanceof TemplateRenderError) {
      preview = "";
      invalidos = err.placeholdersInvalidos;
      faltando = err.faltando;
    } else {
      preview = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
        {preview || (
          <span className="text-muted-foreground">
            Preview vazio — preencha o template
          </span>
        )}
      </div>
      {invalidos.length > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Placeholders inválidos: {invalidos.join(", ")}
        </p>
      )}
      {faltando.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Sem valor: {faltando.join(", ")}
        </p>
      )}
    </div>
  );
}
