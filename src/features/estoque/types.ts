import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type Categoria = Tables<"categorias_estoque">;
export type CategoriaInsert = TablesInsert<"categorias_estoque">;
export type CategoriaUpdate = TablesUpdate<"categorias_estoque">;

export type Item = Tables<"itens_estoque">;
export type ItemInsert = TablesInsert<"itens_estoque">;
export type ItemUpdate = TablesUpdate<"itens_estoque">;

export type Movimentacao = Tables<"movimentacoes_estoque">;
export type MovimentacaoTipo = Database["public"]["Enums"]["movimentacao_tipo"];

export const MOVIMENTACAO_TIPO_VALUES: readonly MovimentacaoTipo[] = [
  "entrada",
  "saida_os",
  "saida_loja",
  "ajuste",
] as const;

export const MOVIMENTACAO_TIPO_LABEL: Record<MovimentacaoTipo, string> = {
  entrada: "Entrada",
  saida_os: "Saída (OS)",
  saida_loja: "Saída (Loja)",
  ajuste: "Ajuste",
};

export const UNIDADES = [
  "un",
  "l",
  "kg",
  "m",
  "par",
  "cx",
] as const;
export type Unidade = (typeof UNIDADES)[number];

export const UNIDADE_LABEL: Record<Unidade, string> = {
  un: "Unidade",
  l: "Litro",
  kg: "Quilograma",
  m: "Metro",
  par: "Par",
  cx: "Caixa",
};
