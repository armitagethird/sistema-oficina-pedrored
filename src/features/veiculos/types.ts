import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type Veiculo = Tables<"veiculos">;
export type VeiculoInsert = TablesInsert<"veiculos">;
export type VeiculoUpdate = TablesUpdate<"veiculos">;

export type VwModelo = Tables<"vw_modelos">;

export type VeiculoComModelo = Veiculo & {
  vw_modelo: Pick<VwModelo, "modelo" | "motor" | "combustivel"> | null;
};

export function descreveVeiculo(v: {
  modelo_custom?: string | null;
  motor?: string | null;
  ano?: number | null;
  placa?: string | null;
  vw_modelo?: { modelo: string; motor: string } | null;
}): string {
  const modelo = v.vw_modelo
    ? `${v.vw_modelo.modelo} ${v.vw_modelo.motor}`
    : v.modelo_custom
      ? v.motor
        ? `${v.modelo_custom} ${v.motor}`
        : v.modelo_custom
      : "Veículo";
  const ano = v.ano ? ` ${v.ano}` : "";
  const placa = v.placa ? ` (${v.placa})` : "";
  return `${modelo}${ano}${placa}`;
}
