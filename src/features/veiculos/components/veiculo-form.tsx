"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createVeiculo, updateVeiculo } from "../actions";
import { veiculoCreateSchema, type VeiculoCreateInput } from "../schemas";
import type { Veiculo, VeiculoComModelo } from "../types";
import { VwModeloCombobox } from "./vw-modelo-combobox";

type VeiculoFormProps = {
  clienteId: string;
  veiculo?: VeiculoComModelo;
  onSuccess?: (veiculo: Veiculo) => void;
  redirectTo?: string;
};

export function VeiculoForm({
  clienteId,
  veiculo,
  onSuccess,
  redirectTo,
}: VeiculoFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [manual, setManual] = React.useState(
    Boolean(veiculo?.modelo_custom && !veiculo?.modelo_id),
  );

  const form = useForm<VeiculoCreateInput>({
    resolver: zodResolver(veiculoCreateSchema),
    defaultValues: {
      cliente_id: clienteId,
      modelo_id: veiculo?.modelo_id ?? null,
      modelo_custom: veiculo?.modelo_custom ?? "",
      motor: veiculo?.motor ?? "",
      ano: veiculo?.ano ?? null,
      placa: veiculo?.placa ?? "",
      cor: veiculo?.cor ?? "",
      km_atual: veiculo?.km_atual ?? 0,
      observacoes: veiculo?.observacoes ?? "",
    },
  });

  async function onSubmit(values: VeiculoCreateInput) {
    setSubmitting(true);
    const result = veiculo
      ? await updateVeiculo(veiculo.id, values)
      : await createVeiculo(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(veiculo ? "Veículo atualizado" : "Veículo criado");
    if (onSuccess) {
      onSuccess(result.data);
    } else if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.push(`/app/veiculos/${result.data.id}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <FormLabel>Modelo *</FormLabel>
          {!manual ? (
            <FormField
              control={form.control}
              name="modelo_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <VwModeloCombobox
                      value={field.value ?? null}
                      onSelect={(modelo) => {
                        field.onChange(modelo?.id ?? null);
                        if (modelo) {
                          form.setValue("modelo_custom", "");
                          form.setValue("motor", modelo.motor);
                        }
                      }}
                      onCustomFallback={() => {
                        setManual(true);
                        form.setValue("modelo_id", null);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Não está aqui?{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        setManual(true);
                        form.setValue("modelo_id", null);
                      }}
                    >
                      Inserir modelo manualmente
                    </button>
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="modelo_custom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Modelo (manual)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Ex: Voyage"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Motor</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Ex: 1.6"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="px-0"
                  onClick={() => {
                    setManual(false);
                    form.setValue("modelo_custom", "");
                    form.setValue("motor", "");
                  }}
                >
                  Voltar pra catálogo VW
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="ano"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="2020"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="ABC1D23"
                    className="uppercase"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Prata"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="km_atual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>KM atual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={field.value ?? 0}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Particularidades do veículo"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : veiculo ? "Salvar" : "Criar veículo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
