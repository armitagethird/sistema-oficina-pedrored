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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/shared/components/money-input";
import { createItem, updateItem } from "../actions";
import {
  itemCreateSchema,
  itemEditSchema,
  type ItemCreateInput,
  type ItemEditInput,
} from "../schemas";
import type { Categoria, Item, Unidade } from "../types";
import { UNIDADES, UNIDADE_LABEL } from "../types";

type ItemFormProps = {
  item?: Item;
  categorias: Categoria[];
  redirectTo?: string;
};

export function ItemForm({ item, categorias, redirectTo }: ItemFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const isEdit = Boolean(item);
  const schema = isEdit ? itemEditSchema : itemCreateSchema;

  const form = useForm<ItemCreateInput | ItemEditInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoria_id: item?.categoria_id ?? categorias[0]?.id ?? "",
      descricao: item?.descricao ?? "",
      sku: item?.sku ?? "",
      unidade: (item?.unidade as Unidade | undefined) ?? "un",
      preco_venda: Number(item?.preco_venda ?? 0),
      alerta_minimo: Number(item?.alerta_minimo ?? 0),
      observacoes: item?.observacoes ?? "",
    },
  });

  async function onSubmit(values: ItemCreateInput | ItemEditInput) {
    setSubmitting(true);
    const result = item
      ? await updateItem(item.id, values as ItemEditInput)
      : await createItem(values as ItemCreateInput);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(item ? "Item atualizado" : "Item criado");
    router.push(redirectTo ?? `/app/estoque/${result.data.id}`);
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
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Ex: Óleo motor 5W30 Selenia 1L"
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
            name="categoria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade *</FormLabel>
                <Select
                  value={field.value ?? "un"}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {UNIDADE_LABEL[u]} ({u})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="preco_venda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de venda *</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value ?? 0}
                    onValueChange={(v) => field.onChange(Number(v))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="alerta_minimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alerta mínimo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Código interno (opcional)"
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
                  placeholder="Compatibilidade, fornecedor preferido..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : item ? "Salvar" : "Criar item"}
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
