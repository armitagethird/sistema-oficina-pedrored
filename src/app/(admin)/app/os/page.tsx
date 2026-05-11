import Link from "next/link";
import { FileTextIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OsListMobile } from "@/features/ordens/components/os-list-mobile";
import { OsListTable } from "@/features/ordens/components/os-list-table";
import { listOS } from "@/features/ordens/queries";
import { OS_STATUS_VALUES, STATUS_LABEL, type OSStatus } from "@/features/ordens/types";
import { EmptyState } from "@/shared/components/empty-state";

const ATIVOS: OSStatus[] = ["aberta", "em_andamento", "aguardando_peca", "pronta"];

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function OSListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? "ativas";
  const search = params.q ?? "";

  const statusParam: OSStatus | OSStatus[] | undefined =
    statusFilter === "ativas"
      ? ATIVOS
      : statusFilter === "todas"
        ? undefined
        : (OS_STATUS_VALUES as readonly string[]).includes(statusFilter)
          ? (statusFilter as OSStatus)
          : ATIVOS;

  const items = await listOS({ status: statusParam, search });

  const tabs: { value: string; label: string }[] = [
    { value: "ativas", label: "Ativas" },
    ...OS_STATUS_VALUES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
    { value: "todas", label: "Todas" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ordens de Serviço
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} OS encontrada{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/os/nova">
            <PlusIcon className="mr-1 size-4" />
            Nova OS
          </Link>
        </Button>
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          type="search"
          placeholder="Buscar por cliente, placa ou #"
          defaultValue={search}
        />
        <input type="hidden" name="status" value={statusFilter} />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <nav className="flex flex-wrap gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const active = t.value === statusFilter;
          const params = new URLSearchParams();
          params.set("status", t.value);
          if (search) params.set("q", search);
          return (
            <Link
              key={t.value}
              href={`/app/os?${params.toString()}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="Nenhuma OS encontrada"
          description={
            statusFilter === "ativas"
              ? "Nenhuma OS ativa. Abra uma nova quando um carro chegar."
              : "Tente outro filtro ou termo de busca."
          }
          action={
            <Button asChild>
              <Link href="/app/os/nova">Abrir OS</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="md:hidden">
            <OsListMobile items={items} />
          </div>
          <div className="hidden md:block">
            <OsListTable items={items} />
          </div>
        </>
      )}
    </div>
  );
}
