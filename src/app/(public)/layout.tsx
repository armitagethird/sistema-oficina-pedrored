import Link from "next/link";

import { CarrinhoIndicator } from "@/features/loja/components/publico/carrinho-indicator";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-neutral-800 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight"
            aria-label="PedroRed — página inicial"
          >
            <span className="text-white">Pedro</span>
            <span className="text-red-500">Red</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/produtos"
              className="text-neutral-400 transition-colors hover:text-white"
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
