"use client";

import * as React from "react";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadComprovante } from "@/app/(public)/checkout/actions";

export function ComprovanteUpload({
  pedidoId,
  telefone,
}: {
  pedidoId: string;
  telefone: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo maior que 5MB");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    const result = await uploadComprovante(pedidoId, fd);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Comprovante enviado — aguarde a confirmação de Pedro");
    router.push(`/pedido/${pedidoId}?tel=${encodeURIComponent(telefone)}`);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <Button
        type="button"
        size="lg"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <UploadIcon className="mr-2 size-5" />
        {uploading ? "Enviando..." : "Enviar comprovante PIX"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Aceitamos imagem ou PDF até 5MB. Pedro confirma o pagamento manualmente.
      </p>
    </div>
  );
}
