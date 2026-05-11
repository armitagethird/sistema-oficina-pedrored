import Link from "next/link";
import { FactoryIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FornecedorCard } from "@/features/fornecedores/components/fornecedor-card";
import { listFornecedores } from "@/features/fornecedores/queries";
import { EmptyState } from "@/shared/components/empty-state";

type SearchParams = Promise<{ q?: string }>;

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.q ?? "";
  const fornecedores = await listFornecedores({ search });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            {fornecedores.length} fornecedor{fornecedores.length === 1 ? "" : "es"}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/fornecedores/novo">
            <PlusIcon className="mr-1 size-4" />
            Novo
          </Link>
        </Button>
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          type="search"
          placeholder="Buscar por nome, telefone ou CNPJ"
          defaultValue={search}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {fornecedores.length === 0 ? (
        <EmptyState
          icon={FactoryIcon}
          title={
            search
              ? "Nenhum fornecedor encontrado"
              : "Você ainda não tem fornecedores"
          }
          description={
            search
              ? "Tente outro termo de busca."
              : "Cadastre fornecedores para registrar pedidos de peças."
          }
          action={
            !search ? (
              <Button asChild>
                <Link href="/app/fornecedores/novo">Cadastrar fornecedor</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {fornecedores.map((fornecedor) => (
            <li key={fornecedor.id}>
              <FornecedorCard fornecedor={fornecedor} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
