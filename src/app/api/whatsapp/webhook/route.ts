/**
 * Webhook Evolution API
 *
 * Recebe eventos em formato `{ event, data, instance }` e:
 *   - MESSAGES_UPSERT direcao=in → insere `whatsapp_msgs`, vincula cliente por telefone.
 *   - MESSAGES_UPSERT direcao=out (fromMe) → vincula a uma mensagem já registrada
 *     (caso a Evolution ecoe o envio antes do nosso update).
 *   - MESSAGES_UPDATE / SEND_MESSAGE → atualiza `status` da mensagem outgoing.
 *
 * Auth opcional via `WHATSAPP_WEBHOOK_SECRET` no header `apikey`.
 */

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";

import type {
  WhatsappMsgStatus,
} from "@/features/whatsapp/types";

export const dynamic = "force-dynamic";

interface WebhookPayload {
  event?: string;
  data?: unknown;
  instance?: string;
}

interface MessageKey {
  id?: string;
  remoteJid?: string;
  fromMe?: boolean;
}

interface MessageContent {
  conversation?: string;
  extendedTextMessage?: { text?: string };
  imageMessage?: { caption?: string };
  videoMessage?: { caption?: string };
}

interface MessageUpsert {
  key?: MessageKey;
  message?: MessageContent;
  pushName?: string;
  messageTimestamp?: number | string;
  status?: string;
}

const STATUS_MAP: Record<string, WhatsappMsgStatus> = {
  PENDING: "pendente",
  SERVER_ACK: "enviada",
  DELIVERY_ACK: "entregue",
  READ: "lida",
  PLAYED: "lida",
  ERROR: "falhou",
};

function extractTexto(msg: MessageContent | undefined): string {
  if (!msg) return "";
  return (
    msg.conversation ??
    msg.extendedTextMessage?.text ??
    msg.imageMessage?.caption ??
    msg.videoMessage?.caption ??
    ""
  );
}

function normalizarTelefoneJid(jid: string | undefined): string {
  if (!jid) return "";
  // remoteJid no formato `5571987654321@s.whatsapp.net`
  const at = jid.indexOf("@");
  const numero = at >= 0 ? jid.slice(0, at) : jid;
  return numero.replace(/\D/g, "");
}

function ackToStatus(payload: MessageUpsert): WhatsappMsgStatus | null {
  if (payload.status && STATUS_MAP[payload.status]) {
    return STATUS_MAP[payload.status];
  }
  return null;
}

export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (secret) {
    const headerKey = req.headers.get("apikey") ?? req.headers.get("authorization");
    if (headerKey !== secret && headerKey !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const supabase = createServiceRoleClient();

  if (event === "messages.upsert" || event === "MESSAGES_UPSERT") {
    const arr = Array.isArray(payload.data) ? payload.data : [payload.data];
    let processadas = 0;
    for (const raw of arr) {
      const msg = raw as MessageUpsert;
      if (!msg || !msg.key) continue;
      const telefone = normalizarTelefoneJid(msg.key.remoteJid);
      if (!telefone) continue;
      const conteudo = extractTexto(msg.message);

      if (msg.key.fromMe) {
        // Eco de mensagem outgoing — atualiza msg existente caso evolution_msg_id bata
        if (msg.key.id) {
          await supabase
            .from("whatsapp_msgs")
            .update({
              status: ackToStatus(msg) ?? "enviada",
              payload_raw: msg as never,
            })
            .eq("evolution_msg_id", msg.key.id);
        }
        continue;
      }

      // Mensagem recebida — direcao=in, vincula cliente por telefone se existir
      const { data: cliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("telefone", telefone)
        .is("deletado_em", null)
        .maybeSingle();

      const { error: insertErr } = await supabase
        .from("whatsapp_msgs")
        .insert({
          cliente_id: cliente?.id ?? null,
          telefone,
          direcao: "in",
          conteudo,
          status: "entregue",
          evolution_msg_id: msg.key.id ?? null,
          payload_raw: msg as never,
        });

      if (insertErr) {
        console.error("webhook insert in:", insertErr);
        continue;
      }
      processadas += 1;
    }
    return NextResponse.json({ ok: true, processadas });
  }

  if (
    event === "messages.update" ||
    event === "MESSAGES_UPDATE" ||
    event === "send.message" ||
    event === "SEND_MESSAGE"
  ) {
    const arr = Array.isArray(payload.data) ? payload.data : [payload.data];
    let atualizadas = 0;
    for (const raw of arr) {
      const msg = raw as MessageUpsert;
      const status = ackToStatus(msg);
      const evoId = msg?.key?.id;
      if (!status || !evoId) continue;
      const { error } = await supabase
        .from("whatsapp_msgs")
        .update({ status })
        .eq("evolution_msg_id", evoId);
      if (error) {
        console.error("webhook update:", error);
        continue;
      }
      atualizadas += 1;
    }
    return NextResponse.json({ ok: true, atualizadas });
  }

  return NextResponse.json({ ok: true, ignored: event });
}
