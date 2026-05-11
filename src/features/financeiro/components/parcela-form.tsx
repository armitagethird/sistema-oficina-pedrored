"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/shared/components/money-input";
import { createPagamento, editarPagamento } from "../actions";
import { pagamentoCreateSchema, type PagamentoCreateInput } from "../schemas";
import {
  PAGAMENTO_METODO_LABEL,
  PAGAMENTO_METODO_VALUES,
  type Pagamento,
} from "../types";

type ParcelaFormProps = {
  osId: string;
  pagamento?: Pagamento;
  ordemSugerida?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ParcelaForm({
  osId,
  pagamento,
  ordemSugerida,
  onSuccess,
  onCancel,
}: ParcelaFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const isEdit = Boolean(pagamento);

  const form = useForm<PagamentoCreateInput>({
    resolver: zodResolver(pagamentoCreateSchema),
    defaultValues: {
      os_id: osId,
      ordem: pagamento?.ordem ?? ordemSugerida ?? 1,
      valor: pagamento?.valor ?? 0,
      metodo: pagamento?.metodo ?? "pix",
      data_prevista: pagamento?.data_prevista ?? "",
      observacoes: pagamento?.observacoes ?? "",
    },
  });

  async function onSubmit(values: PagamentoCreateInput) {
    setSubmitting(true);
    const result = pagamento
      ? await editarPagamento(pagamento.id, {
          valor: values.valor,
          metodo: values.metodo as Pagamento["metodo"],
          data_prevista: values.data_prevista ?? null,
          observacoes: values.observacoes ?? null,
        })
      : await createPagamento(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Parcela atualizada" : "Parcela criada");
    onSuccess?.();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor *</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={String(field.value ?? "")}
                    onValueChange={(v) => field.onChange(Number(v) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metodo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAGAMENTO_METODO_VALUES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAGAMENTO_METODO_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="data_prevista"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data prevista</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  rows={2}
                  placeholder="Notas sobre esta parcela"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} size="sm">
            {submitting ? "Salvando..." : isEdit ? "Salvar" : "Criar parcela"}
          </Button>
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
