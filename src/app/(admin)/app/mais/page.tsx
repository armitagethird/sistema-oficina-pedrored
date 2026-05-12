import Link from "next/link";
import {
  BoxIcon,
  FactoryIcon,
  MessageCircleIcon,
  PackageIcon,
  ReceiptIcon,
  Settings2Icon,
  StoreIcon,
  UserIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ITENS: {
  href: string;
  label: string;
  description: string;
  icon: typeof BoxIcon;
  disabled?: boolean;
}[] = [
  {
    href: "/app/whatsapp",
    label: "WhatsApp",
    description: "Mensagens, templates e crons",
    icon: MessageCircleIcon,
  },
  {
    href: "/app/loja",
    label: "Loja PedroRed",
    description: "Produtos e pedidos online",
    icon: StoreIcon,
  },
  {
    href: "/app/financeiro",
    label: "Financeiro",
    description: "Parcelas, contas a receber",
    icon: ReceiptIcon,
  },
  {
    href: "/app/clientes",
    label: "Clientes",
    description: "Cadastros e histórico",
    icon: UserIcon,
  },
  {
    href: "/app/fornecedores",
    label: "Fornecedores",
    description: "Empresas e pedidos",
    icon: FactoryIcon,
  },
  {
    href: "/app/pedidos-fornecedor",
    label: "Pedidos a fornecedor",
    description: "Compras de peças",
    icon: BoxIcon,
  },
  {
    href: "/app/estoque/categorias",
    label: "Categorias de estoque",
    description: "Gerenciar tipos",
    icon: PackageIcon,
  },
  {
    href: "/app/loja/configuracoes",
    label: "Configurações da loja",
    description: "Chave PIX, domínio",
    icon: Settings2Icon,
  },
];

export default function MaisPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mais</h1>
        <p className="text-sm text-muted-foreground">Outros módulos do sistema</p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {ITENS.map((item) => {
          const Icon = item.icon;
          if (item.disabled) {
            return (
              <li key={item.label}>
                <Card className="cursor-not-allowed opacity-60">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.label}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link href={item.href}>
                <Card className="transition-colors hover:bg-accent">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.label}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0" />
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
