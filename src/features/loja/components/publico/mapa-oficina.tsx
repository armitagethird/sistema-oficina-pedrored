import { ArrowRightIcon, MapPinIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  CONTATO,
  getEnderecoCompleto,
  getMapsEmbedUrl,
  getMapsUrl,
} from "../../contato";

export function MapaOficina() {
  const { logradouro, bairro, cidade, estado, cep } = CONTATO.endereco;

  return (
    <section className="border-t bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_1.2fr] md:items-stretch md:gap-8 md:px-6 md:py-14">
        <div className="flex flex-col gap-4 md:justify-center">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-red-500">
              <MapPinIcon className="size-4" />
              Visite a oficina
            </span>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              {cidade} — {estado}
            </h2>
            <p className="text-sm text-muted-foreground">
              Pra orçamento presencial, retirada de peças ou serviço na linha
              Volkswagen TSI/MSI.
            </p>
          </div>

          <address className="not-italic text-sm leading-relaxed text-muted-foreground">
            {logradouro}
            <br />
            {bairro}, {cidade} — {estado}
            <br />
            CEP {cep}
          </address>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={getMapsUrl()} target="_blank" rel="noreferrer">
                Abrir no Google Maps
                <ArrowRightIcon className="ml-1 size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href={CONTATO.whatsapp.href}
                target="_blank"
                rel="noreferrer"
              >
                Combinar visita
              </a>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <iframe
            src={getMapsEmbedUrl()}
            title={`Mapa: ${getEnderecoCompleto()}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[280px]"
          />
        </div>
      </div>
    </section>
  );
}
