import type { Produto } from "../../types";
import { ProdutoCard } from "./produto-card";

export function ProdutoGrid({ produtos }: { produtos: Produto[] }) {
  if (produtos.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {produtos.map((p) => (
        <ProdutoCard key={p.id} produto={p} />
      ))}
    </div>
  );
}
