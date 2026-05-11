import { OsWizard } from "@/features/ordens/components/os-wizard";

export default function NovaOSPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Nova OS</h1>
        <p className="text-sm text-muted-foreground">
          Selecione cliente, veículo e descreva o problema.
        </p>
      </header>
      <OsWizard />
    </div>
  );
}
