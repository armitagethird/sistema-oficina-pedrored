import type { ProdutoComEstoque } from "../../types";
import { ProdutoCard } from "./produto-card";

export function ProdutoGrid({ produtos }: { produtos: ProdutoComEstoque[] }) {
  if (produtos.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-px bg-[color:var(--hairline)] sm:grid-cols-3 md:grid-cols-4">
      {produtos.map((p) => (
        <ProdutoCard key={p.id} produto={p} />
      ))}
    </div>
  );
}
