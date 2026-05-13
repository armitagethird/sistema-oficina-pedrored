interface Props {
  ocupados: number;
  capacidade: number;
  className?: string;
}

export function OcupacaoIndicator({ ocupados, capacidade, className }: Props) {
  const disponivel = Math.max(0, capacidade - ocupados);
  const percentual = capacidade > 0 ? (ocupados / capacidade) * 100 : 0;
  const cheio = disponivel === 0;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {ocupados}/{capacidade} agendamentos
        </span>
        <span
          className={
            cheio
              ? "font-medium text-destructive"
              : "text-muted-foreground"
          }
        >
          {cheio
            ? "Lotado"
            : `${disponivel} vaga${disponivel !== 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            percentual >= 100
              ? "bg-destructive"
              : percentual >= 66
                ? "bg-amber-500"
                : "bg-primary"
          }`}
          style={{ width: `${Math.min(100, percentual)}%` }}
        />
      </div>
    </div>
  );
}
