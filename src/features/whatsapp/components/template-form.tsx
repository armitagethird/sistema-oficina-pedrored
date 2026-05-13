"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { atualizarTemplate } from "../actions";
import { PLACEHOLDERS_POR_TEMPLATE } from "../constants";
import type { TemplateVars } from "../schemas";
import { TEMPLATE_LABEL, type WhatsappTemplate } from "../types";
import { PreviewMensagem } from "./preview-mensagem";

interface Props {
  template: WhatsappTemplate;
}

const EXEMPLOS: TemplateVars = {
  nome: "Maria Souza",
  primeiro_nome: "Maria",
  data: "15/07",
  periodo: "manhã",
  valor: "R$ 350,00",
  pix_chave: "pedrored@email.com",
  os_numero: "42",
  km_estimado: "98.500",
  dias_atraso: "7",
  texto: "Mensagem livre",
};

export function TemplateForm({ template }: Props) {
  const [texto, setTexto] = useState(template.template_texto);
  const [pending, start] = useTransition();
  const placeholders = PLACEHOLDERS_POR_TEMPLATE[template.tipo];

  function salvar() {
    start(async () => {
      const result = await atualizarTemplate({
        tipo: template.tipo,
        template_texto: texto,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Erro ao salvar");
        return;
      }
      toast.success(`Template "${TEMPLATE_LABEL[template.tipo]}" salvo`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="texto-template" className="text-sm font-medium">
          Texto da mensagem
        </Label>
        <Textarea
          id="texto-template"
          rows={6}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Placeholders disponíveis:{" "}
          {placeholders.map((p) => (
            <code
              key={p}
              className="mr-1 rounded bg-muted px-1 py-0.5 text-[11px]"
            >{`{{${p}}}`}</code>
          ))}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Preview com dados de exemplo</Label>
        <PreviewMensagem texto={texto} vars={EXEMPLOS} />
      </div>

      <div>
        <Button onClick={salvar} disabled={pending} size="sm">
          {pending ? "Salvando..." : "Salvar template"}
        </Button>
      </div>
    </div>
  );
}
