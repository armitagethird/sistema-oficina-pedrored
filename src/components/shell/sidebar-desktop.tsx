"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BoxIcon,
  CalendarIcon,
  FactoryIcon,
  FileTextIcon,
  HomeIcon,
  MessageCircleIcon,
  PackageIcon,
  ReceiptIcon,
  Settings2Icon,
  StoreIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof HomeIcon;
  match: (path: string) => boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    label: "Operação",
    items: [
      {
        href: "/app",
        label: "Dashboard",
        icon: HomeIcon,
        match: (p) => p === "/app",
      },
      {
        href: "/app/os",
        label: "Ordens de Serviço",
        icon: FileTextIcon,
        match: (p) => p.startsWith("/app/os"),
      },
      {
        href: "/app/agenda",
        label: "Agenda",
        icon: CalendarIcon,
        match: (p) => p.startsWith("/app/agenda"),
      },
      {
        href: "/app/estoque",
        label: "Estoque",
        icon: PackageIcon,
        match: (p) =>
          p.startsWith("/app/estoque") &&
          !p.startsWith("/app/estoque/categorias"),
      },
    ],
  },
  {
    label: "Cadastros",
    items: [
      {
        href: "/app/clientes",
        label: "Clientes",
        icon: UsersIcon,
        match: (p) => p.startsWith("/app/clientes"),
      },
      {
        href: "/app/fornecedores",
        label: "Fornecedores",
        icon: FactoryIcon,
        match: (p) => p.startsWith("/app/fornecedores"),
      },
      {
        href: "/app/pedidos-fornecedor",
        label: "Pedidos a fornecedor",
        icon: BoxIcon,
        match: (p) => p.startsWith("/app/pedidos-fornecedor"),
      },
    ],
  },
  {
    label: "Negócio",
    items: [
      {
        href: "/app/financeiro",
        label: "Financeiro",
        icon: ReceiptIcon,
        match: (p) => p.startsWith("/app/financeiro"),
      },
      {
        href: "/app/whatsapp",
        label: "WhatsApp",
        icon: MessageCircleIcon,
        match: (p) => p.startsWith("/app/whatsapp"),
      },
      {
        href: "/app/loja",
        label: "Loja",
        icon: StoreIcon,
        match: (p) =>
          p.startsWith("/app/loja") && !p.startsWith("/app/loja/configuracoes"),
      },
    ],
  },
  {
    label: "Configurações",
    items: [
      {
        href: "/app/estoque/categorias",
        label: "Categorias de estoque",
        icon: PackageIcon,
        match: (p) => p.startsWith("/app/estoque/categorias"),
      },
      {
        href: "/app/loja/configuracoes",
        label: "Configurações da loja",
        icon: Settings2Icon,
        match: (p) => p.startsWith("/app/loja/configuracoes"),
      },
    ],
  },
];

export function SidebarDesktop() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
      <nav
        aria-label="Navegação lateral"
        className="sticky top-14 flex flex-col gap-4 p-3"
      >
        {GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
