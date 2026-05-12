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
import { createFornecedor, updateFornecedor } from "../actions";
import { fornecedorCreateSchema, type FornecedorCreateInput } from "../schemas";
import type { Fornecedor } from "../types";

type FornecedorFormProps = {
  fornecedor?: Fornecedor;
  onSuccess?: (fornecedor: Fornecedor) => void;
  redirectTo?: string;
};

export function FornecedorForm({
  fornecedor,
  onSuccess,
  redirectTo,
}: FornecedorFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FornecedorCreateInput>({
    resolver: zodResolver(fornecedorCreateSchema),
    defaultValues: {
      nome: fornecedor?.nome ?? "",
      telefone: fornecedor?.telefone ?? "",
      email: fornecedor?.email ?? "",
      cnpj: fornecedor?.cnpj ?? "",
      endereco: fornecedor?.endereco ?? "",
      observacoes: fornecedor?.observacoes ?? "",
    },
  });

  async function onSubmit(values: FornecedorCreateInput) {
    setSubmitting(true);
    const result = fornecedor
      ? await updateFornecedor(fornecedor.id, values)
      : await createFornecedor(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(fornecedor ? "Fornecedor atualizado" : "Fornecedor criado");
    if (onSuccess) {
      onSuccess(result.data);
    } else if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.push(`/app/fornecedores/${result.data.id}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Ex: Auto Peças VW Centro"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(11) 99999-9999"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="email"
                    autoComplete="email"
                    placeholder="vendas@fornecedor.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  inputMode="numeric"
                  placeholder="00.000.000/0001-00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Rua, número, bairro, cidade"
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
                  rows={3}
                  placeholder="Prazo de entrega, formas de pagamento, peças que costuma ter..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : fornecedor ? "Salvar" : "Criar fornecedor"}
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
