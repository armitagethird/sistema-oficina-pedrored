import Link from "next/link";
import { MapPinIcon } from "lucide-react";

import { CarrinhoIndicator } from "@/features/loja/components/publico/carrinho-indicator";
import {
  InstagramIcon,
  YoutubeIcon,
} from "@/features/loja/components/publico/social-icons";
import {
  CONTATO,
  getEnderecoCompleto,
  getMapsUrl,
} from "@/features/loja/contato";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ano = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 text-white backdrop-blur supports-[backdrop-filter]:bg-neutral-950/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight"
            aria-label="PedroRed — página inicial"
          >
            <span className="text-white">Pedro</span>
            <span className="text-red-500">Red</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-4">
            <Link
              href="/produtos"
              className="text-neutral-300 transition-colors hover:text-white"
            >
              Catálogo
            </Link>
            <a
              href={CONTATO.youtube.canal}
              target="_blank"
              rel="noreferrer"
              aria-label="Canal do PedroRed no YouTube"
              className="text-neutral-300 transition-colors hover:text-red-500"
            >
              <YoutubeIcon className="size-5" />
            </a>
            <a
              href={CONTATO.instagram.url}
              target="_blank"
              rel="noreferrer"
              aria-label="PedroRed no Instagram"
              className="text-neutral-300 transition-colors hover:text-pink-400"
            >
              <InstagramIcon className="size-5" />
            </a>
            <CarrinhoIndicator />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3 md:px-6">
          <div className="flex flex-col gap-2">
            <p className="text-lg font-bold tracking-tight">
              <span className="text-foreground">Pedro</span>
              <span className="text-red-500">Red</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Peças e serviços para linha Volkswagen TSI/MSI. Selecionado pelo
              mecânico que entende do seu carro.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <h3 className="font-semibold">Visite a oficina</h3>
            <a
              href={getMapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-start gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <MapPinIcon className="mt-0.5 size-4 shrink-0" />
              <span>{getEnderecoCompleto()}</span>
            </a>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <h3 className="font-semibold">Conecte-se</h3>
            <a
              href={CONTATO.whatsapp.href}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {CONTATO.whatsapp.label}
            </a>
            <a
              href={CONTATO.youtube.canal}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <YoutubeIcon className="size-4" />
              YouTube {CONTATO.youtube.handle}
            </a>
            <a
              href={CONTATO.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <InstagramIcon className="size-4" />
              Instagram {CONTATO.instagram.handle}
            </a>
          </div>
        </div>

        <div className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
            <p>© {ano} PedroRed. Todos os direitos reservados.</p>
            <p>
              Feito por{" "}
              <a
                href={CONTATO.creditoDev.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground transition-colors hover:text-red-500"
              >
                {CONTATO.creditoDev.nome}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
