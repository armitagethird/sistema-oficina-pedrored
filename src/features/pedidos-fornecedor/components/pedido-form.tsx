"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { FornecedorCombobox } from "@/features/fornecedores/components/fornecedor-combobox";
import { OsCombobox } from "@/features/ordens/components/os-combobox";
import { createPedido, updatePedido } from "../actions";
import { pedidoCreateSchema, type PedidoCreateInput } from "../schemas";
import type { Pedido } from "../types";

type PedidoFormProps = {
  pedido?: Pedido;
  initialFornecedorId?: string;
  initialOsId?: string;
  onSuccess?: (pedido: Pedido) => void;
};

export function PedidoForm({
  pedido,
  initialFornecedorId,
  initialOsId,
  onSuccess,
}: PedidoFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<PedidoCreateInput>({
    resolver: zodResolver(pedidoCreateSchema),
    defaultValues: {
      fornecedor_id: pedido?.fornecedor_id ?? initialFornecedorId ?? "",
      os_id: pedido?.os_id ?? initialOsId ?? null,
      status: pedido?.status ?? "cotacao",
      data_compra: pedido?.data_compra ?? "",
      data_recebimento: pedido?.data_recebimento ?? "",
      observacoes: pedido?.observacoes ?? "",
    },
  });

  async function onSubmit(values: PedidoCreateInput) {
    setSubmitting(true);
    const result = pedido
      ? await updatePedido(pedido.id, values)
      : await createPedido(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(pedido ? "Pedido atualizado" : "Pedido criado");
    if (onSuccess) {
      onSuccess(result.data);
    } else {
      router.push(`/app/pedidos-fornecedor/${result.data.id}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="fornecedor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor *</FormLabel>
              <FormControl>
                <FornecedorCombobox
                  value={field.value || null}
                  onSelect={(f) => field.onChange(f.id)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="os_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OS vinculada</FormLabel>
              <FormControl>
                <OsCombobox
                  value={field.value ?? null}
                  onSelect={(id) => field.onChange(id)}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Opcional. Vincule se este pedido é para uma OS específica.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="data_compra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da compra</FormLabel>
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
            name="data_recebimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do recebimento</FormLabel>
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
                  placeholder="Notas internas, prazo, número de pedido do fornecedor..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : pedido ? "Salvar" : "Criar pedido"}
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
