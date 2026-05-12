"use client";

import * as React from "react";
import QRCode from "qrcode";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  qrText: string;
  chave: string;
  valor: number;
};

export function PixQrDisplay({ qrText, chave, valor }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrText, {
      width: 280,
      margin: 1,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    }).catch((err) => {
      console.error("QR draw error:", err);
    });
  }, [qrText]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(qrText);
      toast.success("Código PIX copiado");
    } catch {
      toast.error("Não foi possível copiar — selecione manualmente");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Escaneie com o app do banco
      </p>
      <canvas ref={canvasRef} aria-label="QR Code PIX" />
      <div className="flex w-full flex-col gap-2 rounded-md bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          Ou copie o código PIX:
        </p>
        <code className="break-all rounded bg-card p-2 text-xs">{qrText}</code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          className="self-start"
        >
          <CopyIcon className="mr-1 size-4" />
          Copiar código
        </Button>
        <div className="flex justify-between border-t pt-2 text-sm">
          <span className="text-muted-foreground">Chave</span>
          <span className="font-medium">{chave}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-semibold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(valor)}
          </span>
        </div>
      </div>
    </div>
  );
}
