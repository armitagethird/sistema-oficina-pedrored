import Link from "next/link";
import { ChevronLeftIcon, KeyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfigLojaPage() {
  const chave = process.env.PIX_CHAVE ?? null;
  const nome = process.env.PIX_NOME_BENEFICIARIO ?? null;
  const cidade = process.env.PIX_CIDADE ?? null;
  const dominio = process.env.NEXT_PUBLIC_SITE_URL ?? null;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/app/loja">
          <ChevronLeftIcon className="mr-1 size-4" />
          Voltar
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da loja</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
            <KeyIcon className="size-4" />
            Valores carregados das variáveis de ambiente (Vercel Settings). Pra
            alterar, atualize <code>.env.local</code> em dev ou Env Vars em
            produção.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Chave PIX</p>
              <p className="font-medium">
                {chave ?? <span className="text-red-600">não configurada</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Beneficiário</p>
              <p className="font-medium">
                {nome ?? <span className="text-red-600">não configurado</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cidade</p>
              <p className="font-medium">
                {cidade ?? <span className="text-red-600">não configurada</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Domínio público</p>
              <p className="font-medium">
                {dominio ?? (
                  <span className="text-muted-foreground">
                    usando sistema-oficina-pedrored.vercel.app
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
