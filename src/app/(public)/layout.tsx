import Link from "next/link";
import { WrenchIcon } from "lucide-react";

import { CarrinhoIndicator } from "@/features/loja/components/publico/carrinho-indicator";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <WrenchIcon className="size-5 text-red-600" />
            <span>PedroRed Store</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/produtos"
              className="text-muted-foreground hover:text-foreground"
            >
              Catálogo
            </Link>
            <CarrinhoIndicator />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            PedroRed — peças e serviços para linha Volkswagen TSI/MSI.
          </p>
          <p>
            Dúvidas? Fale no{" "}
            <a
              href="https://wa.me/55"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
