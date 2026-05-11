import { ClienteForm } from "@/features/clientes/components/cliente-form";

export default function NovoClientePage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Novo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados básicos. Endereço e observações são opcionais.
        </p>
      </header>
      <ClienteForm />
    </div>
  );
}
