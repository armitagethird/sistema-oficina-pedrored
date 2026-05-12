import type { ItemListItem } from "../queries";
import { ItemCard } from "./item-card";

export function ItensListMobile({ items }: { items: ItemListItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}
