import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LinkAfiliado, LinkAfiliadoStatus } from "./types";

type ClienteMin = { id: string; nome: string };
type OsMin = { id: string; numero: number };

export type LinkAfiliadoListItem = LinkAfiliado & {
  cliente: ClienteMin | null;
  os: OsMin | null;
};

const LIST_SELECT =
  "*, cliente:clientes(id, nome), os:ordens_servico(id, numero)";

export type ListLinksOptions = {
  status?: LinkAfiliadoStatus | LinkAfiliadoStatus[];
  clienteId?: string;
  osId?: string;
  limit?: number;
};

export async function listLinks(
  opts: ListLinksOptions = {},
): Promise<LinkAfiliadoListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("links_afiliado_enviados")
    .select(LIST_SELECT)
    .order("data_envio", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.status) {
    if (Array.isArray(opts.status)) {
      query = query.in("status", opts.status);
    } else {
      query = query.eq("status", opts.status);
    }
  }
  if (opts.clienteId) query = query.eq("cliente_id", opts.clienteId);
  if (opts.osId) query = query.eq("os_id", opts.osId);

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao listar links: ${error.message}`);
  return (data ?? []) as LinkAfiliadoListItem[];
}

export async function listLinksByCliente(
  clienteId: string,
): Promise<LinkAfiliadoListItem[]> {
  return listLinks({ clienteId });
}

export async function listLinksByOs(
  osId: string,
): Promise<LinkAfiliadoListItem[]> {
  return listLinks({ osId });
}

export async function getLink(
  id: string,
): Promise<LinkAfiliadoListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links_afiliado_enviados")
    .select(LIST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar link: ${error.message}`);
  return (data as LinkAfiliadoListItem | null) ?? null;
}
