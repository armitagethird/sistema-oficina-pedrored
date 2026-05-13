import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { CheckoutForm } from "@/features/loja/components/publico/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="bg-background">
      <div className="border-b border-[color:var(--hairline)]">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
          <Link
            href="/carrinho"
            className="text-display inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" />
            Voltar ao carrinho
          </Link>
        </div>
      </div>

      <section className="border-b border-[color:var(--hairline)]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
          <div className="flex flex-col gap-5">
            <span className="eyebrow">§ FECHAMENTO DO PEDIDO</span>
            <h1 className="text-display text-5xl uppercase leading-[0.85] md:text-7xl lg:text-8xl">
              Checkout
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Confirme seus dados — Pedro gera o PIX, envia comprovante pelo
              WhatsApp e libera o pedido em seguida.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
        <CheckoutForm />
      </section>
    </div>
  );
}
