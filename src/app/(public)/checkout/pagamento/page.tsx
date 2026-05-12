import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ComprovanteUpload } from "@/features/loja/components/publico/comprovante-upload";
import { PixQrDisplay } from "@/features/loja/components/publico/pix-qr-display";
import { gerarPixBRCode } from "@/features/loja/pix";
import { getPedidoPublico } from "@/features/loja/queries";

type SearchParams = Promise<{ id?: string; tel?: string }>;

export default async function PagamentoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const id = params.id;
  const tel = params.tel ?? "";
  if (!id) notFound();

  const pedido = await getPedidoPublico(id, tel);
  if (!pedido) notFound();

  const chave = process.env.PIX_CHAVE ?? "pedro@example.com";
  const nome = process.env.PIX_NOME_BENEFICIARIO ?? "Pedro Silva";
  const cidade = process.env.PIX_CIDADE ?? "Cidade";

  const qrText = gerarPixBRCode({
    chave,
    nome,
    cidade,
    valor: Number(pedido.valor_total),
    txid: `PED${pedido.numero}`,
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-6 md:py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pedido #{pedido.numero} · pague com PIX
        </h1>
        <p className="text-sm text-muted-foreground">
          Use o QR ou copie o código pra pagar. Depois envie o comprovante e
          Pedro confirma manualmente.
        </p>
      </div>

      <PixQrDisplay
        qrText={qrText}
        chave={chave}
        valor={Number(pedido.valor_total)}
      />

      <ComprovanteUpload pedidoId={pedido.id} telefone={tel} />

      <div className="text-sm text-muted-foreground">
        Já enviou o comprovante?{" "}
        <Link
          href={`/pedido/${pedido.id}?tel=${encodeURIComponent(tel)}`}
          className="underline hover:text-foreground"
        >
          Acompanhar status do pedido
        </Link>
        .
      </div>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/produtos">Voltar ao catálogo</Link>
      </Button>
    </div>
  );
}
