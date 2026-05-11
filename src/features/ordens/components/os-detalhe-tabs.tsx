"use client";

import * as React from "react";
import { LinkIcon, WalletIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ParcelasItemized } from "@/features/financeiro/components/parcelas-itemized";
import { LinksList } from "@/features/ml-afiliado/components/links-list";
import { RegistrarLinkDialog } from "@/features/ml-afiliado/components/registrar-link-dialog";
import { formatBRL } from "@/shared/format/money";
import type { OSDetalhe } from "../queries";
import { OsFotoUploader } from "./os-foto-uploader";
import { OsFotosGrid } from "./os-fotos-grid";
import { OsHeaderEditor } from "./os-header-editor";
import { OsPecasItemized } from "./os-pecas-itemized";
import { OsServicosItemized } from "./os-servicos-itemized";

export function OsDetalheTabs({ os }: { os: OSDetalhe }) {
  const pagamentosAtivos = os.pagamentos.filter((p) => p.status !== "cancelado");
  const totalPago = os.pagamentos.reduce(
    (acc, p) => acc + (p.status === "pago" ? Number(p.valor) : 0),
    0,
  );
  const totalGeral = Number(os.total_geral);
  const progresso =
    totalGeral > 0 ? Math.min(100, (totalPago / totalGeral) * 100) : 0;
  const temAtrasado = os.pagamentos.some((p) => p.status === "atrasado");

  return (
    <Tabs defaultValue="geral" className="w-full">
      <TabsList className="flex flex-wrap h-auto">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="servicos">
          Serviços ({os.servicos.length})
        </TabsTrigger>
        <TabsTrigger value="pecas">Peças ({os.pecas.length})</TabsTrigger>
        <TabsTrigger value="pagamentos">
          Pagamentos ({pagamentosAtivos.length})
        </TabsTrigger>
        <TabsTrigger value="links">Links ML ({os.links.length})</TabsTrigger>
        <TabsTrigger value="fotos">Fotos ({os.fotos.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="geral" className="mt-4 flex flex-col gap-4">
        <OsHeaderEditor os={os} />
        <div className="grid gap-2 rounded-md border bg-muted/30 px-3 py-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Total serviços</p>
            <p className="font-medium">{formatBRL(os.total_servicos)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total peças</p>
            <p className="font-medium">{formatBRL(os.total_pecas)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total geral</p>
            <p className="font-semibold">{formatBRL(os.total_geral)}</p>
          </div>
        </div>

        <div className="rounded-md border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <WalletIcon className="size-4 text-muted-foreground" />
              Pagamento
            </p>
            <p className="text-sm">
              <span className="font-medium">{formatBRL(totalPago)}</span>
              <span className="text-muted-foreground"> / {formatBRL(totalGeral)}</span>
            </p>
          </div>
          <Progress value={progresso} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {totalGeral === 0
              ? "Adicione serviços/peças pra definir o total"
              : temAtrasado
                ? `${progresso.toFixed(0)}% pago · há parcela atrasada`
                : `${progresso.toFixed(0)}% pago`}
          </p>
        </div>
      </TabsContent>

      <TabsContent value="servicos" className="mt-4">
        <OsServicosItemized osId={os.id} servicos={os.servicos} />
      </TabsContent>

      <TabsContent value="pecas" className="mt-4">
        <OsPecasItemized
          osId={os.id}
          pecas={os.pecas}
          pedidosVinculados={os.pedidos_vinculados}
        />
      </TabsContent>

      <TabsContent value="pagamentos" className="mt-4">
        <ParcelasItemized
          osId={os.id}
          totalGeral={totalGeral}
          pagamentos={os.pagamentos}
        />
      </TabsContent>

      <TabsContent value="links" className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LinkIcon className="size-4" />
            Links Mercado Livre enviados para esta OS.
          </p>
          {os.cliente ? (
            <RegistrarLinkDialog clienteId={os.cliente.id} osId={os.id} />
          ) : null}
        </div>
        <LinksList links={os.links} showOs={false} />
      </TabsContent>

      <TabsContent value="fotos" className="mt-4 flex flex-col gap-4">
        <OsFotoUploader osId={os.id} />
        <OsFotosGrid fotos={os.fotos} />
      </TabsContent>
    </Tabs>
  );
}
