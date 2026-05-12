"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TrashIcon, UploadIcon } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ItemCombobox } from "@/features/estoque/components/item-combobox";
import { MoneyInput } from "@/shared/components/money-input";
import {
  createProduto,
  removerProdutoFoto,
  updateProduto,
  uploadProdutoFoto,
} from "../../actions";
import {
  produtoCreateSchema,
  type ProdutoCreateInput,
} from "../../schemas";
import {
  PRODUTO_STATUS_LABEL,
  PRODUTO_STATUS_VALUES,
  type Produto,
} from "../../types";

type Props = {
  produto?: Produto;
};

export function ProdutoForm({ produto }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [fotos, setFotos] = React.useState<string[]>(
    Array.isArray(produto?.fotos) ? (produto!.fotos as string[]) : [],
  );

  const form = useForm<ProdutoCreateInput>({
    resolver: zodResolver(produtoCreateSchema),
    defaultValues: {
      titulo: produto?.titulo ?? "",
      descricao: produto?.descricao ?? "",
      preco: Number(produto?.preco ?? 0),
      preco_promocional: produto?.preco_promocional
        ? Number(produto.preco_promocional)
        : null,
      estoque_manual: produto?.estoque_manual ?? null,
      frete_info: produto?.frete_info ?? "",
      status: (produto?.status as "ativo" | "inativo" | "esgotado") ?? "ativo",
      destaque: produto?.destaque ?? false,
      ordem_destaque: produto?.ordem_destaque ?? 0,
      item_estoque_id: produto?.item_estoque_id ?? null,
      somente_sob_encomenda: produto?.somente_sob_encomenda ?? false,
    },
  });

  const sobEncomenda = form.watch("somente_sob_encomenda") ?? false;

  async function onSubmit(values: ProdutoCreateInput) {
    setSubmitting(true);
    const payload = { ...values, fotos };
    const result = produto
      ? await updateProduto(produto.id, payload)
      : await createProduto(payload);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(produto ? "Produto atualizado" : "Produto criado");
    router.push(`/app/loja/produtos/${result.data.id}`);
    router.refresh();
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!produto) {
      toast.error("Salve o produto antes de enviar fotos");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    const result = await uploadProdutoFoto(produto.id, fd);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setFotos((curr) => [...curr, result.data.url]);
    e.target.value = "";
  }

  async function handleRemoveFoto(url: string) {
    if (!produto) {
      setFotos((curr) => curr.filter((u) => u !== url));
      return;
    }
    const result = await removerProdutoFoto(produto.id, url);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setFotos((curr) => curr.filter((u) => u !== url));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Ex: Filtro de óleo MANN W712"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={4}
                  placeholder="Especificações, compatibilidade, observações"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="preco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço *</FormLabel>
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
            name="preco_promocional"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço promocional (opcional)</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value ?? 0}
                    onValueChange={(v) =>
                      field.onChange(Number(v) || null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="estoque_manual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque manual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Deixe vazio se vincular a item de estoque"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frete_info"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Informação de entrega</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Ex: Retira na oficina / Entrega 2 dias úteis"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="somente_sob_encomenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Somente sob encomenda?</FormLabel>
              <Select
                value={field.value ? "yes" : "no"}
                onValueChange={(v) => {
                  const yes = v === "yes";
                  field.onChange(yes);
                  if (yes) form.setValue("item_estoque_id", null);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">Não — pronta entrega</SelectItem>
                  <SelectItem value="yes">
                    Sim — Pedro encomenda após pedido
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sob encomenda não baixa estoque e não pode ser vinculado a item
                de estoque.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {sobEncomenda ? null : (
          <FormField
            control={form.control}
            name="item_estoque_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vincular a item de estoque (opcional)</FormLabel>
                <FormControl>
                  <div>
                    {field.value ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Vinculado
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(null)}
                        >
                          Desvincular
                        </Button>
                      </div>
                    ) : (
                      <ItemCombobox
                        value={null}
                        onSelect={(it) => field.onChange(it.id)}
                        placeholder="Vincular para baixar estoque ao confirmar pedido"
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value ?? "ativo"}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUTO_STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PRODUTO_STATUS_LABEL[s]}
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
            name="destaque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destaque?</FormLabel>
                <Select
                  value={field.value ? "yes" : "no"}
                  onValueChange={(v) => field.onChange(v === "yes")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ordem_destaque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem destaque</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={field.value ?? 0}
                    onChange={(e) =>
                      field.onChange(Number(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Fotos</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotos.map((url) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-md border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFoto(url)}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-red-600"
                  aria-label="Remover foto"
                >
                  <TrashIcon className="size-3" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-md border border-dashed bg-muted/30 hover:bg-muted">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFotoUpload}
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                <UploadIcon className="size-5" />
                {uploading ? "Enviando..." : "Adicionar foto"}
              </div>
            </label>
          </div>
          {!produto ? (
            <p className="text-xs text-muted-foreground">
              Salve o produto primeiro pra enviar fotos.
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : produto ? "Salvar" : "Criar produto"}
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
