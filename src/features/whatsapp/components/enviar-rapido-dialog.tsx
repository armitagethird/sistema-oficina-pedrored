"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { enviarMensagem } from "../actions";

interface Props {
  telefone: string | null;
  conteudoSugerido: string;
  clienteId?: string | null;
  osId?: string | null;
  pagamentoId?: string | null;
  agendamentoId?: string | null;
  triggerLabel?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function EnviarRapidoDialog({
  telefone,
  conteudoSugerido,
  clienteId,
  osId,
  pagamentoId,
  agendamentoId,
  triggerLabel = "Enviar WhatsApp",
  variant = "outline",
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState(conteudoSugerido);
  const [pending, start] = useTransition();

  function enviar() {
    if (!telefone) {
      toast.error("Cliente sem telefone cadastrado");
      return;
    }
    start(async () => {
      const result = await enviarMensagem({
        telefone,
        conteudo: texto,
        cliente_id: clienteId ?? undefined,
        os_id: osId ?? undefined,
        pagamento_id: pagamentoId ?? undefined,
        agendamento_id: agendamentoId ?? undefined,
        template_tipo: "manual",
      });
      if (!result.ok) {
        toast.error(result.error ?? "Erro ao enviar");
        return;
      }
      if (result.data.ok) {
        toast.success("Mensagem enviada");
      } else if (result.data.reason === "pausado") {
        toast.warning("Envios pausados — ative em Configurações");
      } else {
        toast.error(result.data.error ?? "Falha no envio");
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <MessageCircleIcon className="mr-1 size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar mensagem via WhatsApp</DialogTitle>
          <DialogDescription>
            {telefone
              ? `Telefone: ${telefone}`
              : "Sem telefone cadastrado para este cliente."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="msg-conteudo" className="text-sm font-medium">
            Texto
          </Label>
          <Textarea
            id="msg-conteudo"
            rows={6}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={!telefone}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={enviar} disabled={pending || !telefone || !texto.trim()}>
            {pending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
