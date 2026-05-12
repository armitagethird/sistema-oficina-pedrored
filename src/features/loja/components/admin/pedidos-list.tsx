import type { PedidoLojaListItem } from "../../queries";
import { PedidoCard } from "./pedido-card";

export function PedidosList({
  pedidos,
}: {
  pedidos: PedidoLojaListItem[];
}) {
  return (
    <ul className="flex flex-col gap-2">
      {pedidos.map((p) => (
        <li key={p.id}>
          <PedidoCard pedido={p} />
        </li>
      ))}
    </ul>
  );
}
