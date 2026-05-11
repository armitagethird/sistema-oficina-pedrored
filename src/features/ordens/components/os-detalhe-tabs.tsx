"use client";

import * as React from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatBRL } from "@/shared/format/money";
import type { OSDetalhe } from "../queries";
import { OsFotoUploader } from "./os-foto-uploader";
import { OsFotosGrid } from "./os-fotos-grid";
import { OsPecasItemized } from "./os-pecas-itemized";
import { OsServicosItemized } from "./os-servicos-itemized";
import { OsHeaderEditor } from "./os-header-editor";

export function OsDetalheTabs({ os }: { os: OSDetalhe }) {
  return (
    <Tabs defaultValue="geral" className="w-full">
      <TabsList>
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="servicos">
          Serviços ({os.servicos.length})
        </TabsTrigger>
        <TabsTrigger value="pecas">Peças ({os.pecas.length})</TabsTrigger>
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
      </TabsContent>

      <TabsContent value="servicos" className="mt-4">
        <OsServicosItemized osId={os.id} servicos={os.servicos} />
      </TabsContent>

      <TabsContent value="pecas" className="mt-4">
        <OsPecasItemized osId={os.id} pecas={os.pecas} />
      </TabsContent>

      <TabsContent value="fotos" className="mt-4 flex flex-col gap-4">
        <OsFotoUploader osId={os.id} />
        <OsFotosGrid fotos={os.fotos} />
      </TabsContent>
    </Tabs>
  );
}
