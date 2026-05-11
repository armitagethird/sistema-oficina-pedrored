"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ClienteCombobox } from "@/features/clientes/components/cliente-combobox";
import type { Cliente } from "@/features/clientes/types";
import { VeiculoSelector } from "@/features/veiculos/components/veiculo-selector";
import { descreveVeiculo, type Veiculo } from "@/features/veiculos/types";
import { createOS } from "../actions";

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Cliente" },
  { id: 2, label: "Veículo" },
  { id: 3, label: "Problema" },
];

export function OsWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [veiculo, setVeiculo] = React.useState<Veiculo | null>(null);
  const [km, setKm] = React.useState("");
  const [descricao, setDescricao] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function next() {
    if (step === 1 && !cliente) return toast.error("Selecione um cliente");
    if (step === 2 && !veiculo) return toast.error("Selecione um veículo");
    setStep((s) => (s === 3 ? 3 : ((s + 1) as Step)));
  }

  function back() {
    setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)));
  }

  function submit() {
    if (!cliente || !veiculo) return;
    if (descricao.trim().length < 3) {
      return toast.error("Descreva o problema (mínimo 3 caracteres)");
    }
    const kmNum = km ? Number(km) : null;
    if (km && (!Number.isFinite(kmNum) || kmNum! < 0)) {
      return toast.error("KM inválido");
    }

    startTransition(async () => {
      const r = await createOS({
        cliente_id: cliente.id,
        veiculo_id: veiculo.id,
        descricao_problema: descricao,
        km_entrada: kmNum,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`OS #${r.data.numero} criada`);
      router.push(`/app/os/${r.data.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const completed = step > s.id;
          const active = step === s.id;
          return (
            <React.Fragment key={s.id}>
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full border text-xs font-medium",
                    completed && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary text-primary",
                    !completed && !active && "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {s.id}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    active ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </li>
              {i < STEPS.length - 1 ? (
                <span className="h-px flex-1 bg-border" aria-hidden />
              ) : null}
            </React.Fragment>
          );
        })}
      </ol>

      {step === 1 ? (
        <div className="flex flex-col gap-3">
          <Label>Cliente *</Label>
          <ClienteCombobox
            value={cliente?.id}
            onSelect={(c) => {
              setCliente(c);
              setVeiculo(null);
            }}
          />
          {cliente ? (
            <p className="text-xs text-muted-foreground">
              Selecionado: <span className="font-medium">{cliente.nome}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 2 && cliente ? (
        <div className="flex flex-col gap-3">
          <Label>Veículo *</Label>
          <VeiculoSelector
            clienteId={cliente.id}
            value={veiculo?.id}
            onSelect={setVeiculo}
          />
          {veiculo ? (
            <p className="text-xs text-muted-foreground">
              Selecionado:{" "}
              <span className="font-medium">{descreveVeiculo(veiculo)}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="km_entrada">KM de entrada</Label>
            <Input
              id="km_entrada"
              type="number"
              inputMode="numeric"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder={
                veiculo?.km_atual ? String(veiculo.km_atual) : "Ex: 50000"
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="problema">Problema relatado *</Label>
            <Textarea
              id="problema"
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: revisão completa, troca de óleo e filtros, barulho na suspensão"
            />
          </div>
        </div>
      ) : null}

      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={back}
          disabled={step === 1 || pending}
        >
          Voltar
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            onClick={next}
            disabled={
              (step === 1 && !cliente) || (step === 2 && !veiculo) || pending
            }
          >
            Avançar
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Abrindo..." : "Abrir OS"}
          </Button>
        )}
      </div>
    </div>
  );
}
