import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ConversaThread } from "@/features/whatsapp/components/conversa-thread";
import { EnviarRapidoDialog } from "@/features/whatsapp/components/enviar-rapido-dialog";
import { getMsgsByCliente } from "@/features/whatsapp/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ clienteId: string }>;

export default async function ConversaClientePage({
  params,
}: {
  params: Params;
}) {
  const { clienteId } = await params;

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nome, telefone")
    .eq("id", clienteId)
    .is("deletado_em", null)
    .maybeSingle();

  if (!cliente) notFound();

  const mensagens = await getMsgsByCliente(clienteId);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/whatsapp/conversas">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {cliente.telefone ?? "sem telefone"} · {mensagens.length} mensagem(ns)
          </p>
        </div>
        <EnviarRapidoDialog
          telefone={cliente.telefone}
          clienteId={cliente.id}
          conteudoSugerido=""
          triggerLabel="Nova mensagem"
        />
      </header>

      <Card>
        <CardContent className="p-4">
          <ConversaThread mensagens={mensagens} />
        </CardContent>
      </Card>
    </div>
  );
}
