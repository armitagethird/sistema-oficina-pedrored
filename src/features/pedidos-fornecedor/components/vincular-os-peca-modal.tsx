"use client";

import * as React from "react";
import { LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollableList } from "./scrollable-list";
import { createClient } from "@/lib/supabase/client";
import { formatBRL } from "@/shared/format/money";
import { vincularOsPeca } from "../actions";

type OsPecaOption = {
  id: string;
  descricao: string;
  custo_unitario: number;
  quantidade: number;
  os_id: string;
  os_numero: number;
  cliente_nome: string | null;
};

type VincularOsPecaModalProps = {
  itemId: string;
  currentOsPecaId: string | null;
  trigger?: React.ReactNode;
  onUpdated?: () => void;
};

export function VincularOsPecaModal({
  itemId,
  currentOsPecaId,
  trigger,
  onUpdated,
}: VincularOsPecaModalProps) {
  const [open, setOpen] = React.useState(false);
  const [pecas, setPecas] = React.useState<OsPecaOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("os_pecas")
      .select(
        "id, descricao, custo_unitario, quantidade, os:ordens_servico!inner(id, numero, status, cliente:clientes(nome))",
      )
      .eq("origem", "fornecedor")
      .in("status", ["pendente", "comprada"])
      .limit(80)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error("Erro ao buscar peças pendentes");
          setLoading(false);
          return;
        }
        type Row = {
          id: string;
          descricao: string;
          custo_unitario: number;
          quantidade: number;
          os: {
            id: string;
            numero: number;
            status: string;
            cliente: { nome: string } | null;
          } | null;
        };
        const filtered = (data as unknown as Row[])
          .filter(
            (r) => r.os && r.os.status !== "entregue" && r.os.status !== "cancelada",
          )
          .map((r) => ({
            id: r.id,
            descricao: r.descricao,
            custo_unitario: Number(r.custo_unitario),
            quantidade: Number(r.quantidade),
            os_id: r.os!.id,
            os_numero: r.os!.numero,
            cliente_nome: r.os!.cliente?.nome ?? null,
          }));
        setPecas(filtered);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pecas;
    return pecas.filter(
      (p) =>
        p.descricao.toLowerCase().includes(term) ||
        `#${p.os_numero}`.includes(term) ||
        p.cliente_nome?.toLowerCase().includes(term),
    );
  }, [pecas, search]);

  function handleVincular(osPecaId: string | null) {
    startTransition(async () => {
      const result = await vincularOsPeca(itemId, osPecaId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(osPecaId ? "Vinculado à peça da OS" : "Vínculo removido");
      setOpen(false);
      onUpdated?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            <LinkIcon className="mr-1 size-4" />
            {currentOsPecaId ? "Trocar peça vinculada" : "Vincular peça da OS"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular item à peça de OS</DialogTitle>
          <DialogDescription>
            Mostra apenas peças com origem &quot;fornecedor&quot; e status pendente ou
            comprada, de OS ainda abertas.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="search"
          placeholder="Buscar por peça, OS ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ScrollableList>
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Carregando...
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma peça encontrada.
            </p>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.descricao}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      OS #{p.os_numero}
                      {p.cliente_nome ? ` · ${p.cliente_nome}` : ""} ·{" "}
                      {formatBRL(p.custo_unitario)} × {p.quantidade}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={p.id === currentOsPecaId ? "secondary" : "default"}
                    disabled={pending}
                    onClick={() => handleVincular(p.id)}
                  >
                    {p.id === currentOsPecaId ? "Vinculada" : "Vincular"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollableList>

        <DialogFooter className="sm:justify-between">
          {currentOsPecaId ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => handleVincular(null)}
            >
              Remover vínculo
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
