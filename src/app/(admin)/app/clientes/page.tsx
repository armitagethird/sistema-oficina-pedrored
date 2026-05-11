import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClienteCard } from "@/features/clientes/components/cliente-card";
import { listClientes } from "@/features/clientes/queries";
import { EmptyState } from "@/shared/components/empty-state";

type SearchParams = Promise<{ q?: string }>;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.q ?? "";
  const clientes = await listClientes({ search });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientes.length} cliente{clientes.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/clientes/novo">
            <PlusIcon className="mr-1 size-4" />
            Novo
          </Link>
        </Button>
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          type="search"
          placeholder="Buscar por nome ou telefone"
          defaultValue={search}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {clientes.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={
            search ? "Nenhum cliente encontrado" : "Você ainda não tem clientes"
          }
          description={
            search
              ? "Tente outro termo de busca."
              : "Cadastre seu primeiro cliente para abrir uma OS."
          }
          action={
            !search ? (
              <Button asChild>
                <Link href="/app/clientes/novo">Cadastrar cliente</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {clientes.map((cliente) => (
            <li key={cliente.id}>
              <ClienteCard cliente={cliente} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
