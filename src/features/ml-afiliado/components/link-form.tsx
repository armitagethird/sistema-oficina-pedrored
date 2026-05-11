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
import { Textarea } from "@/components/ui/textarea";
import { ClienteCombobox } from "@/features/clientes/components/cliente-combobox";
import { OsCombobox } from "@/features/ordens/components/os-combobox";
import { MoneyInput } from "@/shared/components/money-input";
import { editarLink, registrarLinkEnviado } from "../actions";
import { linkCreateSchema, type LinkCreateInput } from "../schemas";
import type { LinkAfiliado } from "../types";

type LinkFormProps = {
  link?: LinkAfiliado;
  initialClienteId?: string;
  initialOsId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function LinkForm({
  link,
  initialClienteId,
  initialOsId,
  onSuccess,
  onCancel,
}: LinkFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const isEdit = Boolean(link);

  const form = useForm<LinkCreateInput>({
    resolver: zodResolver(linkCreateSchema),
    defaultValues: {
      cliente_id: link?.cliente_id ?? initialClienteId ?? "",
      os_id: link?.os_id ?? initialOsId ?? null,
      link: link?.link ?? "",
      descricao_peca: link?.descricao_peca ?? "",
      preco_estimado: link?.preco_estimado ?? null,
      comissao_estimada: link?.comissao_estimada ?? null,
      observacoes: link?.observacoes ?? "",
    },
  });

  async function onSubmit(values: LinkCreateInput) {
    setSubmitting(true);
    const result = link
      ? await editarLink(link.id, values)
      : await registrarLinkEnviado(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Link atualizado" : "Link registrado");
    onSuccess?.();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="cliente_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <FormControl>
                <ClienteCombobox
                  value={field.value || null}
                  onSelect={(c) => field.onChange(c.id)}
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link Mercado Livre *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="url"
                  placeholder="https://produto.mercadolivre.com.br/..."
                  inputMode="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao_peca"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da peça *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: Filtro de ar MANN C25114"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="preco_estimado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço estimado</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) =>
                      field.onChange(v === "" ? null : Number(v) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="comissao_estimada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comissão estimada</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) =>
                      field.onChange(v === "" ? null : Number(v) || 0)
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
                  rows={2}
                  placeholder="Notas sobre este envio"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Salvando..." : isEdit ? "Salvar" : "Registrar"}
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
