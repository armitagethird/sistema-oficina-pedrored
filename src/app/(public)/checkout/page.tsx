import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/features/loja/components/publico/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 md:px-6 md:py-10">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/carrinho">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar ao carrinho
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="text-sm text-muted-foreground">
        Após confirmar os dados, geramos o PIX pro pagamento.
      </p>
      <CheckoutForm />
    </div>
  );
}
