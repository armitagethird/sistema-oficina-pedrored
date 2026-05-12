import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type LinkAfiliado = Tables<"links_afiliado_enviados">;
export type LinkAfiliadoInsert = TablesInsert<"links_afiliado_enviados">;
export type LinkAfiliadoUpdate = TablesUpdate<"links_afiliado_enviados">;
export type LinkAfiliadoStatus =
  Database["public"]["Enums"]["link_afiliado_status"];

export const LINK_STATUS_VALUES: readonly LinkAfiliadoStatus[] = [
  "enviado",
  "cliente_comprou",
  "comissao_recebida",
  "cancelado",
] as const;

export const LINK_STATUS_LABEL: Record<LinkAfiliadoStatus, string> = {
  enviado: "Enviado",
  cliente_comprou: "Cliente comprou",
  comissao_recebida: "Comissão recebida",
  cancelado: "Cancelado",
};

const TRANSITIONS: Record<LinkAfiliadoStatus, readonly LinkAfiliadoStatus[]> = {
  enviado: ["cliente_comprou", "cancelado"],
  cliente_comprou: ["comissao_recebida", "cancelado"],
  comissao_recebida: [],
  cancelado: [],
};

export function isLinkTransitionAllowed(
  from: LinkAfiliadoStatus,
  to: LinkAfiliadoStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getNextLinkStatuses(
  from: LinkAfiliadoStatus,
): readonly LinkAfiliadoStatus[] {
  return TRANSITIONS[from];
}
