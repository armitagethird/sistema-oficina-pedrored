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
import { formatBRL } from "@/shared/format/money";
import { criarPedido } from "@/app/(public)/checkout/actions";
import {
  pedidoCreateSchema,
  type PedidoCreateInput,
} from "../../schemas";
import { carrinhoStore, useCarrinho } from "./carrinho-store";

export function CheckoutForm() {
  const router = useRouter();
  const state = useCarrinho();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<PedidoCreateInput>({
    resolver: zodResolver(pedidoCreateSchema),
    defaultValues: {
      cliente_nome: "",
      cliente_telefone: "",
      cliente_email: "",
      cliente_endereco: {
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        uf: "",
        complemento: "",
      },
      observacoes_cliente: "",
      itens: state.items.map((i) => ({
        produto_id: i.produtoId,
        quantidade: i.qtd,
      })),
    },
  });

  React.useEffect(() => {
    form.setValue(
      "itens",
      state.items.map((i) => ({
        produto_id: i.produtoId,
        quantidade: i.qtd,
      })),
    );
  }, [state.items, form]);

  const total = state.items.reduce((s, i) => s + i.preco * i.qtd, 0);

  async function onSubmit(values: PedidoCreateInput) {
    if (state.items.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }
    setSubmitting(true);
    const result = await criarPedido(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    // Limpa carrinho e leva pra página de pagamento
    carrinhoStore.clear();
    const tel = encodeURIComponent(values.cliente_telefone);
    router.push(`/checkout/pagamento?id=${result.data.pedidoId}&tel=${tel}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Seus dados</h2>
          <FormField
            control={form.control}
            name="cliente_nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Como devemos chamar você"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cliente_telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (WhatsApp) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      inputMode="tel"
                      placeholder="(11) 99999-9999"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="email"
                      placeholder="seu@email.com (opcional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Endereço de entrega</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField
              control={form.control}
              name="cliente_endereco.cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP *</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="numeric" placeholder="01310-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_endereco.rua"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Rua *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Av Paulista" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_endereco.numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número *</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="numeric" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_endereco.bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_endereco.cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_endereco.uf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={2}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_endereco.complemento"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Apto, bloco, referência..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Resumo do pedido</h2>
          <ul className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm">
            {state.items.map((it) => (
              <li
                key={it.produtoId}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0 truncate">
                  {it.titulo}{" "}
                  <span className="text-muted-foreground">× {it.qtd}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatBRL(it.preco * it.qtd)}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </li>
          </ul>
          <FormField
            control={form.control}
            name="observacoes_cliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={3}
                    placeholder="Algo que Pedro precisa saber? (ex: prefiro retirar na oficina)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Criando pedido..." : "Continuar para pagamento"}
        </Button>
      </form>
    </Form>
  );
}
