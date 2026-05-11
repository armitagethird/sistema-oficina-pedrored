"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, Home, Menu, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Início", icon: Home, match: (p: string) => p === "/app" },
  {
    href: "/app/os",
    label: "OS",
    icon: FileText,
    match: (p: string) => p.startsWith("/app/os"),
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
    href: "/app/mais",
    label: "Mais",
    icon: Menu,
    match: (p: string) => p.startsWith("/app/mais"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
