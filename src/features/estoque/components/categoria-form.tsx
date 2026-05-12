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
import { createCategoria, updateCategoria } from "../actions";
import { categoriaSchema, type CategoriaInput } from "../schemas";
import type { Categoria } from "../types";

type CategoriaFormProps = {
  categoria?: Categoria;
  onSuccess?: () => void;
};

export function CategoriaForm({ categoria, onSuccess }: CategoriaFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<CategoriaInput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: categoria?.nome ?? "",
      ordem: categoria?.ordem ?? 0,
    },
  });

  async function onSubmit(values: CategoriaInput) {
    setSubmitting(true);
    const result = categoria
      ? await updateCategoria(categoria.id, values)
      : await createCategoria(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(categoria ? "Categoria atualizada" : "Categoria criada");
    onSuccess?.();
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
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
                  placeholder="Ex: Lubrificantes"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ordem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordem</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : categoria ? "Salvar" : "Criar"}
        </Button>
      </form>
    </Form>
  );
}
