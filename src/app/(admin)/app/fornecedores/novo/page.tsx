import { FornecedorForm } from "@/features/fornecedores/components/fornecedor-form";

export default function NovoFornecedorPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Novo fornecedor</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre fornecedores para vincular aos pedidos de peças.
        </p>
      </header>
      <FornecedorForm />
    </div>
  );
}
