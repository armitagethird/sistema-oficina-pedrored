import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

export type Fornecedor = Tables<"fornecedores">;
export type FornecedorInsert = TablesInsert<"fornecedores">;
export type FornecedorUpdate = TablesUpdate<"fornecedores">;
