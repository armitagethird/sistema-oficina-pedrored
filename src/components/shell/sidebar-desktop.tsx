"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileText,
  Home,
  Package,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Dashboard", icon: Home, match: (p: string) => p === "/app" },
  {
    href: "/app/os",
    label: "Ordens de Serviço",
    icon: FileText,
    match: (p: string) => p.startsWith("/app/os"),
  },
  {
    href: "/app/clientes",
    label: "Clientes",
    icon: Users,
    match: (p: string) => p.startsWith("/app/clientes"),
  },
  {
    href: "/app/estoque",
    label: "Estoque",
    icon: Package,
    match: (p: string) => p.startsWith("/app/estoque"),
  },
  {
    href: "/app/agenda",
    label: "Agenda",
    icon: Calendar,
    match: (p: string) => p.startsWith("/app/agenda"),
  },
  {
    href: "/app/financeiro",
    label: "Financeiro",
    icon: Wallet,
    match: (p: string) => p.startsWith("/app/financeiro"),
  },
  {
    href: "/app/loja",
    label: "Loja",
    icon: Store,
    match: (p: string) => p.startsWith("/app/loja"),
  },
];

export function SidebarDesktop() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
      <nav aria-label="Navegação lateral" className="sticky top-14 grid gap-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
