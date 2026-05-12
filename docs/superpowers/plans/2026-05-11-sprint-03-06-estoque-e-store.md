# Sprint 3 (Estoque) + Sprint 6 (PedroRed Store) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan combines two sprints in a single branch (`sprint-03-06`) per user decision (one PR at the end).

**Goal:** Pedro tem controle total de estoque (entrada/saída/ajuste, custo médio, alerta de mínimo, auto-baixa via OS) **e** uma loja pública (PedroRed Store) anônima com carrinho, checkout PIX, upload de comprovante e admin para confirmar pagamento + baixar estoque.

**Architecture:** Estoque vive em `src/features/estoque/` e integra com OS via trigger SQL `trg_os_pecas_estoque` + UI `ItemCombobox`. Loja vive em `src/features/loja/` com route group `(public)` para vitrine anônima e `(admin)/app/loja/` para gestão. Estoque é hard dep da Loja: `produtos_loja.item_estoque_id` é FK opcional e `confirmarPagamento` dá baixa via RPC `aplicar_movimentacao_estoque` (`saida_loja`). Notificações WhatsApp (Sprint 5) marcadas como `TODO(sprint-5)`. Infra PIX/domínio com placeholders no `.env.local.template`.

**Tech Stack:** Next.js 16 (App Router), React 19, TS 5, Tailwind 4, shadcn/ui, Supabase (Postgres+Auth+Storage), Vitest, Playwright, qrcode, slugify. Sem zustand — carrinho via `useSyncExternalStore` + localStorage.

**Branch:** `sprint-03-06` (já criada a partir de `main` em b0d64f6 após merge do PR #1 da Sprint 2).

---

## Princípios e guardrails

1. **Self-contained execution.** Cada fase termina com `pnpm typecheck && pnpm lint && pnpm test` verde **e um commit atômico** com mensagem `feat(sprint-N): fase X — <título>` ou `test(sprint-N): ...` / `docs(sprint-N): ...`. Padrão idêntico à Sprint 2 (ver `git log` para referência).
2. **TDD rigoroso** nas zonas de alto risco: `aplicar_movimentacao_estoque` (3B), trigger `trg_os_pecas_estoque` (3E), `gerarPixBRCode` (6B), `carrinho-store` (6C). Teste falha → implementa → teste passa → commit.
3. **Karpathy:** sem flexibilidade especulativa. Não adicionamos campos que o sprint .md não pede. Não criamos abstrações até precisar de 3.
4. **Mobile-first.** Componentes testados primeiro em 375×667. Bottom-nav já existe — só conectamos.
5. **Idioma:** UI pt-BR; identificadores em inglês exceto domínio (`ordens_servico`, `clientes`, `produtos_loja`).
6. **Soft delete em itens_estoque e produtos_loja.** Pedidos e movimentações nunca são deletados de fato.
7. **Money:** `numeric(12,2)` no banco, string no transporte, `formatBRL` na exibição (helper em `src/shared/format/money.ts`).
8. **Verification-before-completion:** ao final de cada sprint, rodar `pnpm typecheck && pnpm lint && pnpm test && pnpm build` e atualizar status em `docs/00-overview.md`.
9. **Vetar policy anon direto em `pedidos_loja`.** Inserts da loja só via server action com `service_role`. Cliente vê o próprio pedido via server action que valida `id + telefone`.

---

## File Structure (alto nível)

### Sprint 3 — Estoque

**Migration:**
- `supabase/migrations/20260615000000_init_estoque.sql` — schema completo do sprint-03.md §"Schema delta"
- `supabase/migrations/20260615000001_alter_pedido_itens_estoque_fk.sql` — `alter pedido_fornecedor_itens add column item_estoque_id` (separada para isolar 3F)

**Feature:**
- `src/features/estoque/types.ts` — re-export dos tipos `Database` + labels constantes
- `src/features/estoque/schemas.ts` — zod (item, movimentação, ajuste)
- `src/features/estoque/queries.ts` — `listItens`, `getItem`, `listMovimentacoes`, `listCategorias`, `itensAbaixoMinimo`
- `src/features/estoque/actions.ts` — `createItem`, `updateItem`, `softDeleteItem`, `registrarEntrada`, `registrarSaida`, `registrarAjuste`, `createCategoria`, `updateCategoria`, `deleteCategoria`
- `src/features/estoque/integration.test.ts` — testa `aplicar_movimentacao_estoque` e trigger via Supabase real

**Componentes:**
- `src/features/estoque/components/{item-form,item-combobox,item-card,itens-list-mobile,itens-list-table,movimentacao-form,movimentacoes-list,alerta-minimo-badge,categoria-form}.tsx`

**Pages:**
- `src/app/(admin)/app/estoque/{page,novo/page,[id]/{page,editar/page},movimentar/page,categorias/page}.tsx`

**Tocados:**
- `src/features/ordens/schemas.ts` — `pecaSchema` ganha `item_estoque_id: z.string().uuid().nullable().optional()`
- `src/features/ordens/actions.ts` — `addPeca`/`updatePeca` passam `item_estoque_id`
- `src/features/ordens/components/os-pecas-itemized.tsx` — render `ItemCombobox` quando `origem === "estoque"`
- `src/features/pedidos-fornecedor/components/pedido-itens-itemized.tsx` — campo opcional item_estoque_id (combobox)
- `src/features/pedidos-fornecedor/actions.ts` — `lancarPedidoNoEstoque(pedidoId)`
- `src/app/(admin)/app/page.tsx` — card "Itens abaixo do mínimo" + remover `disabled` do atalho Estoque

### Sprint 6 — PedroRed Store

**Migration:**
- `supabase/migrations/20260801000000_init_loja.sql` — schema completo do sprint-06.md §"Schema delta"

**Feature pública (em `src/features/loja/`):**
- `types.ts`, `schemas.ts`, `queries.ts`, `actions.ts`, `pix.ts`, `pix.test.ts`
- `components/publico/{hero,produto-card,produto-grid,produto-galeria,add-carrinho-button,carrinho-store,carrinho-store.test,carrinho-drawer,checkout-form,pix-qr-display,comprovante-upload,pedido-status-publico}.tsx`
- `components/admin/{produto-form,produtos-list,pedido-card,pedidos-list,pedido-detalhe,confirmar-pagamento-dialog}.tsx`

**Pages públicas:**
- `src/app/(public)/{layout.tsx,page.tsx}` (atualizar layout que hoje é stub)
- `src/app/(public)/produtos/page.tsx`
- `src/app/(public)/produto/[slug]/page.tsx`
- `src/app/(public)/carrinho/page.tsx`
- `src/app/(public)/checkout/{page.tsx,pagamento/page.tsx,actions.ts}`
- `src/app/(public)/pedido/[id]/page.tsx`
- `src/app/(public)/sitemap.ts`
- `src/app/(public)/robots.ts`

**Pages admin:**
- `src/app/(admin)/app/loja/{page,produtos/{page,novo/page,[id]/page},pedidos/{page,[id]/page},configuracoes/page}.tsx`

**Shared:**
- `src/shared/seo/{default-meta.ts,product-jsonld.ts}`

**Tocados:**
- `src/components/shell/bottom-nav.tsx` — item "Loja" no menu "Mais" (se houver) ou novo link
- `src/app/(admin)/app/page.tsx` — card "Pedidos pendentes (loja)"
- `.env.local.template` — chaves PIX placeholder

---

## Fase 3A — Schema estoque

**Files:**
- Create: `supabase/migrations/20260615000000_init_estoque.sql`
- Modify: `src/lib/supabase/database.types.ts` (gerado)

**Spec source:** `docs/sprints/sprint-03-estoque.md` §"Schema delta" (linhas 44-263). Copiar **literalmente** o SQL — não alterar lógica de custo médio nem políticas.

- [ ] **Step 1: Criar migration**

```bash
# Path completo: supabase/migrations/20260615000000_init_estoque.sql
# Conteúdo: o SQL completo do sprint-03.md §Schema delta (linhas 47-263).
# Inclui: enum movimentacao_tipo, tabelas categorias_estoque/itens_estoque/movimentacoes_estoque,
# função aplicar_movimentacao_estoque, alter os_pecas add item_estoque_id, trigger
# trg_os_pecas_estoque, view view_itens_abaixo_minimo, policies RLS.
```

- [ ] **Step 2: Aplicar migration**

```bash
pnpm db:migrate
```

Expected: `Applying migration 20260615000000_init_estoque.sql... done`.

- [ ] **Step 3: Verificar no banco**

```bash
# Via Supabase SQL Editor ou psql:
# select count(*) from categorias_estoque;        -- esperado 8
# select * from pg_proc where proname = 'aplicar_movimentacao_estoque';  -- esperado 1 row
# select * from information_schema.triggers where trigger_name = 'trg_os_pecas_estoque'; -- 3 rows (INSERT/UPDATE/DELETE)
```

- [ ] **Step 4: Regenerar tipos**

```bash
pnpm db:gen
```

Verificar que `Tables<"itens_estoque">`, `Tables<"categorias_estoque">`, `Tables<"movimentacoes_estoque">` aparecem em `src/lib/supabase/database.types.ts`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260615000000_init_estoque.sql src/lib/supabase/database.types.ts
git commit -m "feat(sprint-3): fase A — schema estoque"
```

---

## Fase 3B — Feature estoque base (TDD onde dói)

**Files:**
- Create: `src/features/estoque/types.ts`
- Create: `src/features/estoque/schemas.ts`
- Create: `src/features/estoque/queries.ts`
- Create: `src/features/estoque/actions.ts`
- Create: `src/features/estoque/schemas.test.ts`
- Create: `src/features/estoque/integration.test.ts`

**Padrão a seguir:** olhar `src/features/financeiro/{schemas,queries,actions,types,schemas.test,integration.test}.ts` — usar a **mesma estrutura** (mesma forma de `ActionResult`, mesmos guards `emptyToNull`).

- [ ] **Step 1: types.ts**

```ts
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

export type Categoria = Tables<"categorias_estoque">;
export type CategoriaInsert = TablesInsert<"categorias_estoque">;

export type Item = Tables<"itens_estoque">;
export type ItemInsert = TablesInsert<"itens_estoque">;
export type ItemUpdate = TablesUpdate<"itens_estoque">;

export type Movimentacao = Tables<"movimentacoes_estoque">;
export type MovimentacaoTipo = Database["public"]["Enums"]["movimentacao_tipo"];

export const MOVIMENTACAO_TIPO_LABEL: Record<MovimentacaoTipo, string> = {
  entrada: "Entrada",
  saida_os: "Saída (OS)",
  saida_loja: "Saída (Loja)",
  ajuste: "Ajuste",
};

export const UNIDADES = ["un", "l", "kg", "m", "par", "cx"] as const;
export type Unidade = (typeof UNIDADES)[number];
```

- [ ] **Step 2: schemas.ts (zod)**

```ts
import { z } from "zod";
import { UNIDADES } from "./types";

export const itemCreateSchema = z.object({
  categoria_id: z.string().uuid(),
  descricao: z.string().min(1, "Descrição obrigatória").max(200),
  sku: z.string().max(80).optional().nullable(),
  unidade: z.enum(UNIDADES),
  preco_venda: z.coerce.number().nonnegative(),
  alerta_minimo: z.coerce.number().nonnegative().default(0),
  observacoes: z.string().max(500).optional().nullable(),
});

export const itemUpdateSchema = itemCreateSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export const entradaSchema = z.object({
  item_id: z.string().uuid(),
  quantidade: z.coerce.number().positive(),
  custo_unitario: z.coerce.number().nonnegative(),
  pedido_fornecedor_id: z.string().uuid().nullable().optional(),
});

export const saidaSchema = z.object({
  item_id: z.string().uuid(),
  quantidade: z.coerce.number().positive(),
  motivo: z.string().max(200).optional().nullable(),
});

export const ajusteSchema = z.object({
  item_id: z.string().uuid(),
  quantidade: z.coerce.number().positive(),
  motivo: z.string().min(1, "Motivo obrigatório").max(200),
});

export const categoriaSchema = z.object({
  nome: z.string().min(1).max(80),
  ordem: z.coerce.number().int().default(0),
});

export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
export type EntradaInput = z.infer<typeof entradaSchema>;
export type SaidaInput = z.infer<typeof saidaSchema>;
export type AjusteInput = z.infer<typeof ajusteSchema>;
export type CategoriaInput = z.infer<typeof categoriaSchema>;
```

- [ ] **Step 3: schemas.test.ts (TDD para schemas)**

Espelhar `src/features/financeiro/schemas.test.ts`. Casos mínimos:
- `itemCreateSchema`: descrição vazia → falha; quantidade negativa em preço → falha; uuid mal-formado em categoria_id → falha; happy path passa.
- `entradaSchema`: quantidade 0 falha; custo negativo falha.
- `ajusteSchema`: motivo vazio falha.

```bash
pnpm test src/features/estoque/schemas.test.ts -- --run
```

Expected: PASS.

- [ ] **Step 4: queries.ts**

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Item, Movimentacao, Categoria } from "./types";

export type ItemListItem = Item & {
  categoria: Pick<Categoria, "id" | "nome"> | null;
};

export type ListItensOptions = {
  categoria_id?: string;
  abaixo_minimo?: boolean;
  ativo?: boolean;
  busca?: string;
  limit?: number;
};

export async function listItens(opts: ListItensOptions = {}): Promise<ItemListItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("itens_estoque")
    .select("*, categoria:categorias_estoque(id, nome)")
    .is("deletado_em", null)
    .order("descricao", { ascending: true })
    .limit(opts.limit ?? 200);

  if (opts.categoria_id) q = q.eq("categoria_id", opts.categoria_id);
  if (opts.ativo !== undefined) q = q.eq("ativo", opts.ativo);

  const { data, error } = await q;
  if (error) throw new Error(`Erro ao listar itens: ${error.message}`);
  let items = (data ?? []) as ItemListItem[];

  if (opts.abaixo_minimo) {
    items = items.filter((i) => Number(i.quantidade_atual) <= Number(i.alerta_minimo));
  }
  if (opts.busca?.trim()) {
    const t = opts.busca.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.descricao.toLowerCase().includes(t) ||
        (i.sku ?? "").toLowerCase().includes(t),
    );
  }
  return items;
}

export async function getItem(id: string): Promise<ItemListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_estoque")
    .select("*, categoria:categorias_estoque(id, nome)")
    .eq("id", id)
    .is("deletado_em", null)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar item: ${error.message}`);
  return data as ItemListItem | null;
}

export async function listMovimentacoes(
  itemId?: string,
  limit = 100,
): Promise<Movimentacao[]> {
  const supabase = await createClient();
  let q = supabase
    .from("movimentacoes_estoque")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limit);
  if (itemId) q = q.eq("item_id", itemId);
  const { data, error } = await q;
  if (error) throw new Error(`Erro ao listar movimentações: ${error.message}`);
  return data ?? [];
}

export async function listCategorias(): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_estoque")
    .select("*")
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });
  if (error) throw new Error(`Erro ao listar categorias: ${error.message}`);
  return data ?? [];
}

export async function contarItensAbaixoMinimo(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("view_itens_abaixo_minimo")
    .select("id");
  if (error) throw new Error(`Erro ao contar itens abaixo do mínimo: ${error.message}`);
  return data?.length ?? 0;
}
```

- [ ] **Step 5: actions.ts (RPC para movimentações)**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ajusteSchema,
  categoriaSchema,
  entradaSchema,
  itemCreateSchema,
  itemUpdateSchema,
  saidaSchema,
  type AjusteInput,
  type CategoriaInput,
  type EntradaInput,
  type ItemCreateInput,
  type ItemUpdateInput,
  type SaidaInput,
} from "./schemas";
import type { Categoria, Item, MovimentacaoTipo } from "./types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateEstoque(id?: string) {
  revalidatePath("/app");
  revalidatePath("/app/estoque");
  if (id) revalidatePath(`/app/estoque/${id}`);
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export async function createItem(input: ItemCreateInput): Promise<ActionResult<Item>> {
  const parsed = itemCreateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_estoque")
    .insert({
      categoria_id: parsed.data.categoria_id,
      descricao: parsed.data.descricao,
      sku: emptyToNull(parsed.data.sku ?? null),
      unidade: parsed.data.unidade,
      preco_venda: parsed.data.preco_venda,
      alerta_minimo: parsed.data.alerta_minimo,
      observacoes: emptyToNull(parsed.data.observacoes ?? null),
    })
    .select("*")
    .single();
  if (error) {
    console.error("createItem:", error);
    return { ok: false, error: "Não foi possível criar o item" };
  }
  revalidateEstoque();
  return { ok: true, data };
}

export async function updateItem(
  id: string,
  input: ItemUpdateInput,
): Promise<ActionResult<Item>> {
  const parsed = itemUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_estoque")
    .update(parsed.data)
    .eq("id", id)
    .is("deletado_em", null)
    .select("*")
    .single();
  if (error) {
    console.error("updateItem:", error);
    return { ok: false, error: "Não foi possível atualizar o item" };
  }
  revalidateEstoque(id);
  return { ok: true, data };
}

export async function softDeleteItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("itens_estoque")
    .update({ deletado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível remover o item" };
  revalidateEstoque();
  return { ok: true, data: undefined };
}

async function aplicarMovimentacao(args: {
  item_id: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  custo_unitario?: number | null;
  os_id?: string | null;
  os_peca_id?: string | null;
  pedido_loja_id?: string | null;
  pedido_fornecedor_id?: string | null;
  ajuste_motivo?: string | null;
}): Promise<ActionResult<{ movimentacao_id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("aplicar_movimentacao_estoque", {
    p_item_id: args.item_id,
    p_tipo: args.tipo,
    p_quantidade: args.quantidade,
    p_custo_unitario: args.custo_unitario ?? null,
    p_os_id: args.os_id ?? null,
    p_os_peca_id: args.os_peca_id ?? null,
    p_pedido_loja_id: args.pedido_loja_id ?? null,
    p_pedido_fornecedor_id: args.pedido_fornecedor_id ?? null,
    p_ajuste_motivo: args.ajuste_motivo ?? null,
  });
  if (error) {
    console.error("aplicarMovimentacao:", error);
    return { ok: false, error: error.message };
  }
  revalidateEstoque(args.item_id);
  return { ok: true, data: { movimentacao_id: data as string } };
}

export async function registrarEntrada(
  input: EntradaInput,
): Promise<ActionResult<{ movimentacao_id: string }>> {
  const parsed = entradaSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  return aplicarMovimentacao({
    item_id: parsed.data.item_id,
    tipo: "entrada",
    quantidade: parsed.data.quantidade,
    custo_unitario: parsed.data.custo_unitario,
    pedido_fornecedor_id: parsed.data.pedido_fornecedor_id ?? null,
  });
}

export async function registrarSaida(
  input: SaidaInput,
): Promise<ActionResult<{ movimentacao_id: string }>> {
  const parsed = saidaSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  // saída manual (sem OS) — usamos tipo saida_os com motivo via observacoes? Não.
  // Decisão: criamos um tipo "saida_avulsa" via ajuste motivo se for caso real.
  // No MVP: saída manual sai como 'saida_loja' com ajuste_motivo descritivo,
  // já que 'saida_os' precisa os_id. Refinar se virar real demanda.
  return aplicarMovimentacao({
    item_id: parsed.data.item_id,
    tipo: "saida_loja",
    quantidade: parsed.data.quantidade,
    ajuste_motivo: parsed.data.motivo ?? "saída avulsa",
  });
}

export async function registrarAjuste(
  input: AjusteInput,
): Promise<ActionResult<{ movimentacao_id: string }>> {
  const parsed = ajusteSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  return aplicarMovimentacao({
    item_id: parsed.data.item_id,
    tipo: "ajuste",
    quantidade: parsed.data.quantidade,
    ajuste_motivo: parsed.data.motivo,
  });
}

export async function createCategoria(
  input: CategoriaInput,
): Promise<ActionResult<Categoria>> {
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_estoque")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return { ok: false, error: "Não foi possível criar a categoria" };
  revalidateEstoque();
  return { ok: true, data };
}

export async function updateCategoria(
  id: string,
  input: CategoriaInput,
): Promise<ActionResult<Categoria>> {
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_estoque")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { ok: false, error: "Não foi possível atualizar a categoria" };
  revalidateEstoque();
  return { ok: true, data };
}

export async function deleteCategoria(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("categorias_estoque").delete().eq("id", id);
  if (error)
    return {
      ok: false,
      error: "Categoria tem itens vinculados ou não pode ser removida",
    };
  revalidateEstoque();
  return { ok: true, data: undefined };
}
```

- [ ] **Step 6: integration.test.ts (TDD da função SQL)**

Espelhar `src/features/financeiro/integration.test.ts`. Casos:
1. Entrada com saldo zero: saldo final = qtd, custo_medio = custo informado.
2. Entrada acumulada: 2 entradas (5 a R$10, 5 a R$20) → saldo 10, custo médio R$15.
3. Saída válida: saldo cai.
4. Saída maior que saldo → `error.message` contém "Estoque insuficiente".
5. Ajuste com motivo: saldo soma, custo médio inalterado.
6. Ajuste sem motivo → erro `ajuste_motivo obrigatório`.

Cada teste cria seu próprio item (transaction-friendly seed) e limpa no final (`delete from itens_estoque where id = ...`).

```bash
pnpm test src/features/estoque/integration.test.ts -- --run
```

Expected: 6 PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/estoque/
git commit -m "feat(sprint-3): fase B — feature estoque base (schemas, queries, actions, testes)"
```

---

## Fase 3C — Páginas admin + componentes estoque

**Files:**
- Create: `src/features/estoque/components/{item-form,item-card,itens-list-mobile,itens-list-table,movimentacao-form,movimentacoes-list,alerta-minimo-badge,item-combobox}.tsx`
- Create: `src/app/(admin)/app/estoque/{page,novo/page,[id]/{page,editar/page},movimentar/page}.tsx`

**Padrão UI:** olhar `src/features/fornecedores/components/{fornecedor-form,fornecedor-card,fornecedor-combobox}.tsx` e `src/app/(admin)/app/fornecedores/` para o pattern de página + form + card. Re-usar `MoneyInput` de `@/shared/components/money-input` e `ItemizedList` de `@/shared/components/itemized-list`.

- [ ] **Step 1: AlertaMinimoBadge** (mais simples, primeiro)

```tsx
"use client";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AlertaMinimoBadge({ qtdAtual, alertaMinimo }: { qtdAtual: number; alertaMinimo: number }) {
  if (qtdAtual > alertaMinimo) return null;
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="size-3" />
      Abaixo do mínimo
    </Badge>
  );
}
```

- [ ] **Step 2: ItemForm**

RHF + zod resolver, mesma estrutura de `fornecedor-form.tsx`. Campos: categoria_id (Select), descricao, sku, unidade (Select), preco_venda (MoneyInput), alerta_minimo (Input number), observacoes (Textarea). Submit chama `createItem` ou `updateItem`. Após sucesso: toast + router.push.

- [ ] **Step 3: ItemCombobox**

Espelhar `src/features/fornecedores/components/fornecedor-combobox.tsx`. Busca por descrição + sku, mostra `{descricao} — {qtd_atual} {unidade}` ao lado. Props: `value, onValueChange, onSelect?(item)` para fluxo OS.

- [ ] **Step 4: ItemCard + ItensListMobile + ItensListTable**

ItemCard mostra descrição, badge categoria, qtd atual (em destaque se ≤ alerta_minimo via `AlertaMinimoBadge`), custo médio (formatBRL), preço de venda. ItensListMobile mapeia em cards (mobile). ItensListTable usa shadcn Table (desktop md+).

- [ ] **Step 5: MovimentacaoForm**

Form com Select tipo (Entrada/Saída/Ajuste), ItemCombobox, Input quantidade, Input custo_unitario (só visível se tipo=Entrada), Input motivo (só visível se tipo=Ajuste). Submit roteia para `registrarEntrada` / `registrarSaida` / `registrarAjuste`.

- [ ] **Step 6: MovimentacoesList**

Tabela com colunas: Data (DD/MM/YY HH:mm), Tipo (badge colorido), Item, Quantidade (com sinal), Custo unit., Saldo após, Origem (OS #N / Pedido #N / Ajuste). Filtros: tipo e período.

- [ ] **Step 7: Página `/app/estoque/page.tsx`**

Server Component. Lê searchParams `categoria`, `abaixo_minimo`, `busca`. Server-side `listItens(opts)` + `listCategorias()`. Renderiza filtros + `ItensListMobile`/`ItensListTable`. Botão "Novo item" → `/app/estoque/novo`. Botão "Movimentar" → `/app/estoque/movimentar`.

- [ ] **Step 8: Páginas restantes**

- `/app/estoque/novo/page.tsx`: `<ItemForm mode="create" categorias={...} />`
- `/app/estoque/[id]/page.tsx`: detalhe com header (descrição+badges), KPIs (qtd, custo_medio, preço_venda, margem), histórico via `MovimentacoesList(itemId)`, botões Editar/Movimentar/Remover.
- `/app/estoque/[id]/editar/page.tsx`: `<ItemForm mode="edit" item={...} />`
- `/app/estoque/movimentar/page.tsx`: `<MovimentacaoForm itens={...} />`

- [ ] **Step 9: Verificar visualmente**

```bash
pnpm dev
# Em 375×667 (DevTools): /app/estoque, /app/estoque/novo, /app/estoque/movimentar
# Verificar bottom-nav "Estoque" highlight, sem overflow horizontal
```

- [ ] **Step 10: typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
git add src/features/estoque/components/ src/app/(admin)/app/estoque/
git commit -m "feat(sprint-3): fase C — páginas admin + componentes estoque"
```

---

## Fase 3D — Categorias CRUD

**Files:**
- Create: `src/features/estoque/components/categoria-form.tsx`
- Create: `src/app/(admin)/app/estoque/categorias/page.tsx`

- [ ] **Step 1: CategoriaForm**

Dialog com Input nome + Input ordem, submit chama `createCategoria` ou `updateCategoria`.

- [ ] **Step 2: Página `/app/estoque/categorias`**

Server Component lista `listCategorias()`. Para cada: linha com nome + ordem + botões Editar (abre dialog) e Excluir (chama `deleteCategoria` — `confirm()`). Botão "Nova categoria" abre dialog vazio. Mostrar erro amigável quando delete falha (categoria tem itens).

- [ ] **Step 3: typecheck + lint + test**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

- [ ] **Step 4: Commit**

```bash
git add src/features/estoque/components/categoria-form.tsx src/app/(admin)/app/estoque/categorias/
git commit -m "feat(sprint-3): fase D — CRUD categorias estoque"
```

---

## Fase 3E — Integração OS (ItemCombobox no editor de peça + trigger)

**Files:**
- Modify: `src/features/ordens/schemas.ts` — `pecaSchema` e `pecaUpdateSchema` ganham `item_estoque_id`
- Modify: `src/features/ordens/types.ts` — `OsPeca` derivado de `Tables<"os_pecas">` já inclui (após `pnpm db:gen` da 3A)
- Modify: `src/features/ordens/actions.ts` — `addPeca`/`updatePeca` passam `item_estoque_id`
- Modify: `src/features/ordens/components/os-pecas-itemized.tsx` — render `ItemCombobox` quando `origem === "estoque"`
- Modify: `src/features/estoque/integration.test.ts` — adicionar testes do trigger

- [ ] **Step 1: Atualizar pecaSchema**

```ts
// schemas.ts
export const pecaSchema = z.object({
  descricao: z.string().min(1),
  origem: z.enum(["estoque", "fornecedor", "mercado_livre_afiliado"]),
  custo_unitario: z.coerce.number().nonnegative(),
  preco_venda_unitario: z.coerce.number().nonnegative(),
  quantidade: z.coerce.number().positive(),
  link_ml: z.string().optional().nullable(),
  fornecedor_nome: z.string().optional().nullable(),
  status: z.enum(["pendente", "comprada", "recebida", "aplicada"]).optional(),
  item_estoque_id: z.string().uuid().nullable().optional(),
}).refine(
  (d) => d.origem !== "estoque" || d.item_estoque_id,
  { message: "Selecione um item de estoque", path: ["item_estoque_id"] },
);

export const pecaUpdateSchema = pecaSchema.partial();
```

- [ ] **Step 2: Atualizar `addPeca` e `updatePeca`**

Adicionar `item_estoque_id: parsed.data.item_estoque_id ?? null` no `.insert(...)` e no patch de `update`.

- [ ] **Step 3: Modificar `os-pecas-itemized.tsx`**

Quando `item.origem === "estoque"`:
- Trocar `<Input descricao>` por `<ItemCombobox value={item.item_estoque_id ?? ""} onSelect={(itm) => { update(idx, { item_estoque_id: itm.id, descricao: itm.descricao, custo_unitario: String(itm.custo_medio), preco_venda_unitario: String(itm.preco_venda) }); persist(idx); }} />`
- Esconder os campos custo/preço/quantidade ficam editáveis mas o custo médio vira default. Mostrar texto auxiliar `Em estoque: {qtd_atual} {unidade}`.

Adicionar `item_estoque_id` ao tipo `Draft`. Init nullable.

- [ ] **Step 4: TDD trigger — adicionar a integration.test.ts**

Casos (criar item via seed):
1. Inserir `os_pecas` com `origem='estoque'` + `item_estoque_id` + `quantidade=4`: assertar que `itens_estoque.quantidade_atual` caiu 4.
2. Atualizar quantidade pra 7: assertar saldo final correto (estorna 4, baixa 7 → cai 3 versus inicial).
3. Deletar a peça: saldo volta ao original.
4. Tentar inserir com `quantidade=999` (acima do saldo): RPC retorna erro "Estoque insuficiente".

```bash
pnpm test src/features/estoque/integration.test.ts -- --run
```

Expected: todos PASS (incluindo os 6 da 3B + 4 novos = 10).

- [ ] **Step 5: typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add src/features/ordens/ src/features/estoque/integration.test.ts
git commit -m "feat(sprint-3): fase E — integração estoque ↔ OS (ItemCombobox + trigger validado)"
```

---

## Fase 3F — Integração pedidos-fornecedor (lancarPedidoNoEstoque)

**Files:**
- Create: `supabase/migrations/20260615000001_alter_pedido_itens_estoque_fk.sql`
- Modify: `src/features/pedidos-fornecedor/schemas.ts`, `actions.ts`, `components/pedido-itens-itemized.tsx`
- Modify: `src/app/(admin)/app/pedidos-fornecedor/[id]/page.tsx` (adicionar botão "Lançar no estoque")

- [ ] **Step 1: Migration aditiva**

```sql
-- supabase/migrations/20260615000001_alter_pedido_itens_estoque_fk.sql
alter table pedido_fornecedor_itens
  add column if not exists item_estoque_id uuid references itens_estoque(id) on delete set null;
create index if not exists idx_pedido_itens_item_estoque on pedido_fornecedor_itens(item_estoque_id);
```

```bash
pnpm db:migrate && pnpm db:gen
```

- [ ] **Step 2: Atualizar pedidoItemCreateSchema/Update**

Adicionar `item_estoque_id: z.string().uuid().nullable().optional()`.

- [ ] **Step 3: Atualizar `addPedidoItem`/`updatePedidoItem`**

Passar `item_estoque_id` no insert/patch.

- [ ] **Step 4: Modificar `pedido-itens-itemized.tsx`**

Adicionar `<ItemCombobox>` opcional ao lado da descrição. Quando selecionado: pre-fill descrição + custo (= custo_medio do item). Persiste com `item_estoque_id`.

- [ ] **Step 5: Action `lancarPedidoNoEstoque`**

```ts
// src/features/pedidos-fornecedor/actions.ts
export async function lancarPedidoNoEstoque(
  pedidoId: string,
): Promise<ActionResult<{ entradas: number }>> {
  const supabase = await createClient();
  const { data: pedido } = await supabase
    .from("pedidos_fornecedor")
    .select("id, status")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return { ok: false, error: "Pedido não encontrado" };
  if (pedido.status !== "recebido")
    return { ok: false, error: "Só é possível lançar pedidos recebidos" };

  const { data: itens, error } = await supabase
    .from("pedido_fornecedor_itens")
    .select("*")
    .eq("pedido_id", pedidoId);
  if (error) return { ok: false, error: error.message };

  let count = 0;
  for (const it of itens ?? []) {
    if (!it.item_estoque_id) continue;
    const { error: rpcErr } = await supabase.rpc("aplicar_movimentacao_estoque", {
      p_item_id: it.item_estoque_id,
      p_tipo: "entrada",
      p_quantidade: it.quantidade,
      p_custo_unitario: it.custo_unitario,
      p_pedido_fornecedor_id: pedidoId,
    });
    if (rpcErr) {
      console.error("lancarPedidoNoEstoque RPC:", rpcErr);
      return { ok: false, error: rpcErr.message };
    }
    count += 1;
  }
  revalidatePedido(pedidoId);
  revalidatePath("/app/estoque");
  return { ok: true, data: { entradas: count } };
}
```

**Idempotência:** Documentar comportamento — chamar duas vezes lançaria entradas duplicadas. No MVP, mostrar `confirm()` no botão e exibir contador "X itens já lançados (data Y)" no header (calcular via `movimentacoes_estoque.pedido_fornecedor_id = pedidoId`). Bloquear botão se contador > 0 a menos que `?forcar=1`.

- [ ] **Step 6: Botão na página pedido**

Em `/app/pedidos-fornecedor/[id]/page.tsx`, quando `status === "recebido"` e há itens com `item_estoque_id`:

```tsx
<Button onClick={async () => { const r = await lancarPedidoNoEstoque(pedido.id); ... }}>
  Lançar entradas no estoque
</Button>
```

Mostrar contador `Já lançado: X itens` quando existem movimentações com `pedido_fornecedor_id` para esse pedido.

- [ ] **Step 7: typecheck + lint + test**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260615000001_alter_pedido_itens_estoque_fk.sql \
        src/features/pedidos-fornecedor/ \
        src/app/(admin)/app/pedidos-fornecedor/[id]/page.tsx \
        src/lib/supabase/database.types.ts
git commit -m "feat(sprint-3): fase F — integração estoque ↔ pedidos fornecedor (lancarPedidoNoEstoque)"
```

---

## Fase 3G — Dashboard + bottom-nav estoque

**Files:**
- Modify: `src/app/(admin)/app/page.tsx`
- Modify (se necessário): `src/components/shell/bottom-nav.tsx` (já tem item Estoque — só validar)

- [ ] **Step 1: Card "Itens abaixo do mínimo"**

Em `page.tsx`, importar `contarItensAbaixoMinimo` e adicionar 5º card no grid:

```tsx
const [contadores, recentes, abaixoMin] = await Promise.all([
  contadoresDashboard(),
  listOSRecentes(5),
  contarItensAbaixoMinimo(),
]);
// ...
<Link href="/app/estoque?abaixo_minimo=1">
  <Card className={cn(abaixoMin > 0 && "border-red-300 dark:border-red-900/40")}>
    <CardHeader>
      <CardTitle className="text-base font-medium">Estoque baixo</CardTitle>
      <CardDescription>Itens abaixo do mínimo</CardDescription>
    </CardHeader>
    <CardContent className="text-3xl font-semibold">{abaixoMin}</CardContent>
  </Card>
</Link>
```

- [ ] **Step 2: Remover `disabled` do atalho Estoque**

Trocar:
```tsx
<Button asChild variant="outline" className="justify-start" disabled>
  <span><PackageIcon className="mr-2 size-4" />Estoque (Sprint 3)</span>
</Button>
```
Por:
```tsx
<Button asChild variant="outline" className="justify-start">
  <Link href="/app/estoque"><PackageIcon className="mr-2 size-4" />Estoque</Link>
</Button>
```

- [ ] **Step 3: typecheck + lint**

- [ ] **Step 4: Commit**

```bash
git add src/app/(admin)/app/page.tsx
git commit -m "feat(sprint-3): fase G — dashboard alerta estoque baixo + atalho ativo"
```

---

## Fase 3H — Testes E2E + docs Sprint 3

**Files:**
- Create: `e2e/sprint-03-estoque.spec.ts`
- Modify: `docs/architecture/data-model.md` (adicionar tabelas/enums/triggers da Sprint 3)
- Modify: `docs/00-overview.md` (Sprint 3 → 🟢)
- Modify: `docs/sprints/sprint-03-estoque.md` (preencher seção Progresso)

- [ ] **Step 1: e2e/sprint-03-estoque.spec.ts**

Espelhar `e2e/sprint-02-financeiro.spec.ts`. Cenários:
1. Login → `/app/estoque` mostra lista vazia inicial (ou seedada).
2. Cadastrar categoria custom e item ("Óleo 5W30 Selenia", categoria Óleo, qtd inicial 0, custo R$45, venda R$70, alerta_min 2).
3. `/app/estoque/movimentar`: Entrada 10 unidades a R$45 → saldo deve ficar 10.
4. Criar OS, adicionar peça com origem=estoque selecionando o item criado, qtd=4 → estoque cai pra 6.
5. Editar a peça pra qtd=7 → estoque cai pra 3.
6. Remover a peça → estoque volta a 10.
7. Tentar peça com qtd=50 → toast com erro "Estoque insuficiente".

```bash
pnpm e2e --grep sprint-03
```

Expected: 7 PASS.

- [ ] **Step 2: Atualizar data-model.md**

Sob "Estado atual": adicionar tabelas `categorias_estoque`, `itens_estoque`, `movimentacoes_estoque`. Adicionar enum `movimentacao_tipo`. Função `aplicar_movimentacao_estoque`. Trigger `trg_os_pecas_estoque`. View `view_itens_abaixo_minimo`. Coluna nova em `os_pecas.item_estoque_id` e em `pedido_fornecedor_itens.item_estoque_id`.

- [ ] **Step 3: 00-overview.md**

Tabela: Sprint 3 status `🟢 implementada`, branch `sprint-03-06`, validado por `aguardando Romero+Pedro`.

- [ ] **Step 4: sprint-03-estoque.md "Progresso"**

Marcar todos os checkboxes da seção "Verificação automatizada" e "Manual (dev)" que passaram.

- [ ] **Step 5: full verification**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add e2e/sprint-03-estoque.spec.ts docs/architecture/data-model.md docs/00-overview.md docs/sprints/sprint-03-estoque.md
git commit -m "docs(sprint-3): fase H — e2e estoque + atualizar overview/data-model"
```

**Checkpoint:** Sprint 3 ✅ feito. Branch ainda não fechada (vamos seguir para Sprint 6 no mesmo branch).

---

## Fase 6A — Schema loja + buckets + tipos

**Files:**
- Create: `supabase/migrations/20260801000000_init_loja.sql`
- Modify: `src/lib/supabase/database.types.ts`

**Spec source:** `docs/sprints/sprint-06-store.md` §"Schema delta" (linhas 62-203). Copiar literalmente.

⚠️ **Buckets:** o SQL tenta `insert into storage.buckets`. Se a Supabase recusar (depende de versão), criar via Dashboard manualmente:
- `loja-produtos` (público)
- `loja-comprovantes` (privado)

E manter as policies (storage.objects) na migration.

- [ ] **Step 1: Migration**

Conteúdo: SQL completo do sprint-06.md §Schema delta (linhas 63-203).

- [ ] **Step 2: db:migrate + db:gen**

```bash
pnpm db:migrate && pnpm db:gen
```

Verificar buckets via Dashboard ou `select * from storage.buckets where id in ('loja-produtos','loja-comprovantes');`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260801000000_init_loja.sql src/lib/supabase/database.types.ts
git commit -m "feat(sprint-6): fase A — schema loja (produtos, pedidos, itens, slug, buckets)"
```

---

## Fase 6B — Deps + PIX util (TDD)

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/features/loja/pix.ts`
- Create: `src/features/loja/pix.test.ts`

**Spec:** PIX BR Code padrão EMV (BACEN). Formato: TLV (Tag-Length-Value) com checksum CRC16-CCITT (poly 0x1021, init 0xFFFF). Campos canônicos:
- `00` Payload Format Indicator `01`
- `26` Merchant Account Information (GUI=br.gov.bcb.pix + chave + descrição opcional)
- `52` Merchant Category Code `0000`
- `53` Transaction Currency `986` (BRL)
- `54` Transaction Amount (string com `.` decimal)
- `58` Country Code `BR`
- `59` Merchant Name
- `60` Merchant City
- `62` Additional Data (txid)
- `63` CRC16

- [ ] **Step 1: Install deps**

```bash
pnpm add qrcode slugify
pnpm add -D @types/qrcode
```

- [ ] **Step 2: pix.test.ts (TDD primeiro)**

Vetor de teste conhecido (extraído da documentação BACEN — exemplo). Asserts:
1. `gerarPixBRCode({ chave: "pedro@example.com", nome: "Pedro Silva", cidade: "Brasilia", valor: 100, txid: "TX001" })` retorna string que começa com `000201` e termina com `6304XXXX` (CRC válido).
2. Recalcular CRC16-CCITT da string sem os últimos 4 chars deve bater com os 4 chars.
3. Comprimento de cada campo TLV bate com o `LL` declarado (parse e re-encode é idempotente).
4. Acentos do nome/cidade são removidos (PIX BR Code aceita só ASCII): "São Paulo" → "Sao Paulo".

```bash
pnpm test src/features/loja/pix.test.ts -- --run
```

Expected: FAIL (função não existe).

- [ ] **Step 3: pix.ts (mínimo que passa)**

```ts
// CRC16-CCITT (polinomial 0x1021, init 0xFFFF)
function crc16(s: string): string {
  let crc = 0xffff;
  for (const c of s) {
    crc ^= c.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

export function gerarPixBRCode(args: {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  txid: string;
}): string {
  const nome = normalize(args.nome).slice(0, 25);
  const cidade = normalize(args.cidade).slice(0, 15);
  const valor = args.valor.toFixed(2);
  const txid = normalize(args.txid).slice(0, 25) || "***";

  const merchantAccount = tlv("00", "br.gov.bcb.pix") + tlv("01", args.chave);
  const additionalData = tlv("05", txid);

  const payload =
    tlv("00", "01") +
    tlv("26", merchantAccount) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", valor) +
    tlv("58", "BR") +
    tlv("59", nome) +
    tlv("60", cidade) +
    tlv("62", additionalData) +
    "6304";

  return payload + crc16(payload);
}
```

```bash
pnpm test src/features/loja/pix.test.ts -- --run
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/features/loja/pix.ts src/features/loja/pix.test.ts
git commit -m "feat(sprint-6): fase B — gerador PIX BR Code (TDD) + deps qrcode/slugify"
```

---

## Fase 6C — Carrinho store client-side (TDD)

**Files:**
- Create: `src/features/loja/components/publico/carrinho-store.ts`
- Create: `src/features/loja/components/publico/carrinho-store.test.ts`

**Decisão:** sem zustand. Usar pattern simples com `useSyncExternalStore` + localStorage (suficiente, e o projeto não tem zustand instalado). 100% client-side.

- [ ] **Step 1: carrinho-store.test.ts (TDD)**

Testes (com mock de localStorage via vitest setup ou shim):
1. `addItem({ produtoId, titulo, preco, qtd: 1 })` adiciona ao state.
2. Chamar `addItem` com mesmo produtoId incrementa qtd.
3. `updateQty(produtoId, 3)` define qtd; com 0 remove o item.
4. `removeItem(produtoId)` remove.
5. `clear()` esvazia.
6. Persistência: após `addItem`, valor está em `localStorage.getItem("pedrored-carrinho")` como JSON.
7. Inicialização lê de localStorage.
8. `totalItens()` soma qtds; `totalValor()` soma preco*qtd.

- [ ] **Step 2: carrinho-store.ts**

```ts
"use client";

export type CarrinhoItem = {
  produtoId: string;
  slug: string;
  titulo: string;
  preco: number;
  qtd: number;
  fotoUrl?: string | null;
};

type State = { items: CarrinhoItem[] };
const KEY = "pedrored-carrinho";
const listeners = new Set<() => void>();
let state: State = load();

function load(): State {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

function emit() {
  for (const l of listeners) l();
}

function set(next: State) {
  state = next;
  persist();
  emit();
}

export const carrinhoStore = {
  getState: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  addItem(item: Omit<CarrinhoItem, "qtd"> & { qtd?: number }) {
    const qtd = item.qtd ?? 1;
    const existing = state.items.find((i) => i.produtoId === item.produtoId);
    set({
      items: existing
        ? state.items.map((i) =>
            i.produtoId === item.produtoId ? { ...i, qtd: i.qtd + qtd } : i,
          )
        : [...state.items, { ...item, qtd }],
    });
  },
  updateQty(produtoId: string, qtd: number) {
    if (qtd <= 0) {
      set({ items: state.items.filter((i) => i.produtoId !== produtoId) });
      return;
    }
    set({
      items: state.items.map((i) =>
        i.produtoId === produtoId ? { ...i, qtd } : i,
      ),
    });
  },
  removeItem(produtoId: string) {
    set({ items: state.items.filter((i) => i.produtoId !== produtoId) });
  },
  clear() {
    set({ items: [] });
  },
  totalItens(): number {
    return state.items.reduce((s, i) => s + i.qtd, 0);
  },
  totalValor(): number {
    return state.items.reduce((s, i) => s + i.preco * i.qtd, 0);
  },
};

// Hook
import { useSyncExternalStore } from "react";
export function useCarrinho() {
  return useSyncExternalStore(carrinhoStore.subscribe, () => state, () => ({ items: [] }));
}
```

```bash
pnpm test src/features/loja/components/publico/carrinho-store.test.ts -- --run
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/loja/components/publico/carrinho-store.ts \
        src/features/loja/components/publico/carrinho-store.test.ts
git commit -m "feat(sprint-6): fase C — carrinho store client-side (useSyncExternalStore + localStorage, TDD)"
```

---

## Fase 6D — Feature loja schemas/queries/types

**Files:**
- Create: `src/features/loja/types.ts`, `schemas.ts`, `queries.ts`, `schemas.test.ts`

- [ ] **Step 1: types.ts**

Re-exports de `Tables<"produtos_loja">`, `Tables<"pedidos_loja">`, `Tables<"itens_pedido_loja">`. Labels para `produto_status` e `pedido_loja_status`.

- [ ] **Step 2: schemas.ts**

zod para:
- `produtoCreateSchema`: titulo, descricao?, preco, preco_promocional?, estoque_manual?, frete_info?, status, destaque, item_estoque_id?
- `produtoUpdateSchema`: partial
- `pedidoCreateSchema`: cliente_nome, cliente_telefone, cliente_email?, cliente_endereco { cep, rua, numero, bairro, cidade, complemento? }, itens [{ produto_id, quantidade }]
- `comprovanteUploadSchema`: pedido_id, file (validação no action)

- [ ] **Step 3: schemas.test.ts**

Casos de fronteira (mesmo padrão da financeiro/schemas.test.ts).

- [ ] **Step 4: queries.ts**

Funções server-only:
- `listProdutosPublicos({ pagina, categoria_id?, faixaPreco?, busca? })` — só ativos
- `listProdutosDestaque(limit = 8)` — ativos + destaque=true, order ordem_destaque
- `getProdutoBySlug(slug)` — só ativos
- `listProdutosAdmin(opts)` — todos
- `listPedidosAdmin({ status?, busca?, limit })` 
- `getPedidoDetalhe(id)` — pedido + itens + produto info
- `getPedidoPublico(id, telefone)` — valida telefone bate; sem auth (usa service_role)

- [ ] **Step 5: typecheck + test**

```bash
pnpm typecheck && pnpm test src/features/loja/schemas.test.ts -- --run
```

- [ ] **Step 6: Commit**

```bash
git add src/features/loja/types.ts src/features/loja/schemas.ts src/features/loja/queries.ts src/features/loja/schemas.test.ts
git commit -m "feat(sprint-6): fase D — schemas/queries/types loja"
```

---

## Fase 6E — Actions público (criarPedido, uploadComprovante)

**Files:**
- Create: `src/app/(public)/checkout/actions.ts`
- Modify: `src/lib/supabase/server.ts` (caso precisemos de `createServiceClient` helper para usar service_role)

⚠️ **Service role:** o `criarPedido` precisa rodar com `service_role` pois `pedidos_loja` não tem policy anon insert. Adicionar helper `createServiceClient()` em `src/lib/supabase/server.ts` que usa `SUPABASE_SERVICE_ROLE_KEY` (já em `.env.local`).

- [ ] **Step 1: createServiceClient helper**

```ts
// src/lib/supabase/server.ts (acrescentar)
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
```

- [ ] **Step 2: actions.ts**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { pedidoCreateSchema, type PedidoCreateInput } from "@/features/loja/schemas";
import { gerarPixBRCode } from "@/features/loja/pix";

export async function criarPedido(input: PedidoCreateInput) {
  const parsed = pedidoCreateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" } as const;

  const supabase = createServiceClient();

  // Lookup produtos atuais para snapshot e validar status=ativo
  const produtoIds = parsed.data.itens.map((i) => i.produto_id);
  const { data: produtos, error: pErr } = await supabase
    .from("produtos_loja")
    .select("id, titulo, preco, preco_promocional, status, item_estoque_id, estoque_manual")
    .in("id", produtoIds);
  if (pErr || !produtos || produtos.length !== produtoIds.length)
    return { ok: false, error: "Algum produto não está mais disponível" } as const;

  for (const p of produtos) {
    if (p.status !== "ativo")
      return { ok: false, error: `Produto "${p.titulo}" indisponível` } as const;
  }

  // (Validação de estoque opcional — preferimos não bloquear no checkout
  // e validar manualmente ao confirmar pagamento.)

  let subtotal = 0;
  const itensInsert = parsed.data.itens.map((it) => {
    const prod = produtos.find((p) => p.id === it.produto_id)!;
    const preco = Number(prod.preco_promocional ?? prod.preco);
    subtotal += preco * it.quantidade;
    return {
      produto_id: prod.id,
      titulo_snapshot: prod.titulo,
      preco_unitario: preco,
      quantidade: it.quantidade,
    };
  });

  const { data: pedido, error: ordErr } = await supabase
    .from("pedidos_loja")
    .insert({
      cliente_nome: parsed.data.cliente_nome,
      cliente_telefone: parsed.data.cliente_telefone,
      cliente_email: parsed.data.cliente_email ?? null,
      cliente_endereco: parsed.data.cliente_endereco,
      valor_subtotal: subtotal,
      valor_frete: 0,
      valor_total: subtotal,
    })
    .select("*")
    .single();
  if (ordErr || !pedido)
    return { ok: false, error: "Não foi possível criar o pedido" } as const;

  const { error: itEnsErr } = await supabase
    .from("itens_pedido_loja")
    .insert(itensInsert.map((it) => ({ ...it, pedido_id: pedido.id })));
  if (itEnsErr) {
    await supabase.from("pedidos_loja").delete().eq("id", pedido.id);
    return { ok: false, error: "Não foi possível criar os itens do pedido" } as const;
  }

  const pixText = gerarPixBRCode({
    chave: process.env.PIX_CHAVE!,
    nome: process.env.PIX_NOME_BENEFICIARIO!,
    cidade: process.env.PIX_CIDADE!,
    valor: Number(pedido.valor_total),
    txid: `PED${pedido.numero}`,
  });

  // TODO(sprint-5): disparar mensagem WhatsApp para cliente
  // com link /pedido/{pedido.id}?tel={cliente_telefone}

  revalidatePath("/app/loja");
  return {
    ok: true,
    data: {
      pedidoId: pedido.id,
      numero: pedido.numero,
      valorTotal: Number(pedido.valor_total),
      pix: { qrText: pixText, chave: process.env.PIX_CHAVE! },
    },
  } as const;
}

export async function uploadComprovante(pedidoId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Arquivo não enviado" } as const;
  if (file.size > 5 * 1024 * 1024)
    return { ok: false, error: "Arquivo maior que 5MB" } as const;

  const supabase = createServiceClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${pedidoId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("loja-comprovantes")
    .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: true });
  if (upErr) return { ok: false, error: "Falha no upload" } as const;

  const { error: updErr } = await supabase
    .from("pedidos_loja")
    .update({ comprovante_url: path, status: "pagamento_em_analise" })
    .eq("id", pedidoId);
  if (updErr) return { ok: false, error: "Falha ao atualizar pedido" } as const;

  revalidatePath(`/pedido/${pedidoId}`);
  revalidatePath("/app/loja/pedidos");
  return { ok: true, data: undefined } as const;
}
```

- [ ] **Step 3: typecheck + lint**

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/server.ts src/app/(public)/checkout/actions.ts
git commit -m "feat(sprint-6): fase E — actions público (criarPedido + uploadComprovante via service_role)"
```

---

## Fase 6F — Actions admin loja

**Files:**
- Create: `src/features/loja/actions.ts`

- [ ] **Step 1: actions.ts**

Functions: `createProduto`, `updateProduto`, `softDeleteProduto`, `uploadProdutoFoto(produtoId, formData)` (storage `loja-produtos`, append em `produtos_loja.fotos jsonb`), `removerProdutoFoto`, `gerarSlug(titulo)` (chama RPC `gerar_slug_unico`), `confirmarPagamento(pedidoId, baixarEstoque=true)`, `atualizarStatusPedido(pedidoId, novoStatus)`, `cancelarPedido(pedidoId, motivo)`.

`confirmarPagamento` quando `baixarEstoque=true`:

```ts
const { data: itens } = await supabase
  .from("itens_pedido_loja")
  .select("quantidade, preco_unitario, produto:produtos_loja(id, item_estoque_id)")
  .eq("pedido_id", pedidoId);
for (const it of itens ?? []) {
  if (it.produto?.item_estoque_id) {
    const { error } = await supabase.rpc("aplicar_movimentacao_estoque", {
      p_item_id: it.produto.item_estoque_id,
      p_tipo: "saida_loja",
      p_quantidade: it.quantidade,
      p_pedido_loja_id: pedidoId,
    });
    if (error) return { ok: false, error: error.message };
  }
}
await supabase
  .from("pedidos_loja")
  .update({ status: "pago", pago_em: new Date().toISOString() })
  .eq("id", pedidoId);
```

Para `createProduto`: usar `gerar_slug_unico` SQL function. Validar `item_estoque_id` existe se enviado.

- [ ] **Step 2: typecheck + lint**

- [ ] **Step 3: Commit**

```bash
git add src/features/loja/actions.ts
git commit -m "feat(sprint-6): fase F — actions admin loja (CRUD produto, confirmarPagamento, baixa estoque)"
```

---

## Fase 6G — Layout/páginas/componentes públicos

**Files:**
- Modify: `src/app/(public)/layout.tsx` (hoje stub)
- Create: `src/app/(public)/page.tsx` (sobrescrever — pode haver placeholder)
- Create: `src/app/(public)/produtos/page.tsx`
- Create: `src/app/(public)/produto/[slug]/page.tsx`
- Create: `src/app/(public)/carrinho/page.tsx`
- Create: `src/app/(public)/checkout/page.tsx`
- Create: `src/app/(public)/checkout/pagamento/page.tsx`
- Create: `src/app/(public)/pedido/[id]/page.tsx`
- Create: `src/features/loja/components/publico/{hero,produto-card,produto-grid,produto-galeria,add-carrinho-button,carrinho-drawer,checkout-form,pix-qr-display,comprovante-upload,pedido-status-publico}.tsx`

**Skills:** Aplicar `design-taste-frontend` + `high-end-visual-design` (CLAUDE.md global obrigatório para frontend). Antes de codar componentes: definir paleta + tipo de tipografia. Mobile-first.

- [ ] **Step 1: shadcn Carousel**

```bash
npx shadcn@latest add carousel
```

- [ ] **Step 2: Layout público com header + footer**

Adicionar header com logo "PedroRed Store" + ícone carrinho (badge com `totalItens`). Footer simples com WhatsApp do Pedro (link `wa.me`). Esconder header no `/checkout/pagamento`.

- [ ] **Step 3: Hero + Home `/`**

Server Component que chama `listProdutosDestaque()`. Hero curto (título + CTA "Ver catálogo"). Grid de destaques (`ProdutoGrid` em mobile 2-col, desktop 4-col).

- [ ] **Step 4: ProdutoCard + ProdutoGrid**

ProdutoCard: foto principal (primeiro de `fotos jsonb`, fallback placeholder), título 2-line clamp, preço (com preco_promocional riscando preco original), botão "Adicionar" mini. Link wrappa pra `/produto/[slug]`.

- [ ] **Step 5: `/produtos` paginação**

Query string `?p=1&categoria=...&min=&max=&q=`. `listProdutosPublicos` retorna `{ items, total, pagina, paginas }`. Paginação shadcn Pagination.

- [ ] **Step 6: `/produto/[slug]`**

Server Component: `getProdutoBySlug(params.slug)`. 404 se null. ProdutoGaleria (carousel) + título + preço + descrição + frete_info + AddCarrinhoButton (client). Schema JSON-LD em `<head>` via `product-jsonld.ts`.

- [ ] **Step 7: AddCarrinhoButton + CarrinhoDrawer**

Client. AddCarrinhoButton chama `carrinhoStore.addItem`, mostra toast "Adicionado". CarrinhoDrawer (shadcn Sheet) mostra `useCarrinho()` items, qtd controls, total e CTA "Finalizar compra" → `/carrinho`.

- [ ] **Step 8: `/carrinho`**

Página de revisão. Lista items com controle de qtd, total. Botão "Continuar" → `/checkout`. Estado vazio com link pra `/produtos`.

- [ ] **Step 9: `/checkout`**

CheckoutForm RHF + zod (`pedidoCreateSchema`). Campos: nome, telefone, email opcional, endereço (CEP, rua, número, bairro, cidade, complemento). Submit chama `criarPedido` → router.push(`/checkout/pagamento?id=${pedidoId}&total=${valorTotal}`).

- [ ] **Step 10: `/checkout/pagamento`**

Recebe `id` e gera PIX via `gerarPixBRCode`. PixQrDisplay renderiza QR (lib `qrcode` toCanvas), botão "Copiar código", e ComprovanteUpload (input file → `uploadComprovante`). Mostra link "Acompanhar pedido" → `/pedido/[id]?tel=...`.

- [ ] **Step 11: `/pedido/[id]`**

Server Component. Query string `?tel=`. Chama `getPedidoPublico(id, tel)`. 404 se telefone não bate. Mostra status + itens + valor + comprovante + próximos passos.

- [ ] **Step 12: typecheck + lint + dev test**

```bash
pnpm typecheck && pnpm lint && pnpm dev
# Browser 375×667: percorrer /, /produtos, /produto/<slug>, /carrinho, /checkout, /checkout/pagamento, /pedido/<id>
```

- [ ] **Step 13: Commit**

```bash
git add src/app/(public)/ src/features/loja/components/publico/ src/components/ui/carousel.tsx
git commit -m "feat(sprint-6): fase G — loja pública (home, catálogo, produto, carrinho, checkout, pedido)"
```

---

## Fase 6H — Páginas/componentes admin loja

**Files:**
- Create: `src/features/loja/components/admin/{produto-form,produtos-list,pedido-card,pedidos-list,pedido-detalhe,confirmar-pagamento-dialog}.tsx`
- Create: `src/app/(admin)/app/loja/{page,produtos/{page,novo/page,[id]/page},pedidos/{page,[id]/page},configuracoes/page}.tsx`

- [ ] **Step 1: ProdutoForm**

RHF + `produtoCreateSchema`. Campos: titulo, descricao (textarea), categoria via tag, preco, preco_promocional, estoque_manual, frete_info, status, destaque, ordem_destaque, **item_estoque_id (ItemCombobox de estoque opcional)**. Upload múltiplo de fotos via input file + estado local (lista de paths já salvos). On submit, salva produto + adiciona fotos em `produtos_loja.fotos jsonb`.

- [ ] **Step 2: ProdutosList admin**

Tabela (desktop) / cards (mobile) com filtros status, destaque, busca.

- [ ] **Step 3: PedidoCard + PedidosList + PedidoDetalhe**

PedidoCard: numero, cliente, valor, status badge, criado_em. PedidoDetalhe: dados cliente, endereço, lista de itens, valor, link comprovante (signed URL), status timeline, botões Confirmar pagamento (abre dialog) / Atualizar status / Cancelar.

- [ ] **Step 4: ConfirmarPagamentoDialog**

Dialog com toggle "Baixar do estoque (se houver vinculados)" default true. Confirma chama `confirmarPagamento(pedidoId, baixarEstoque)`.

- [ ] **Step 5: Páginas admin**

- `/app/loja/page.tsx`: resumo (pedidos pendentes count, vendas mês, produtos ativos) + links.
- `/app/loja/produtos`: ProdutosList.
- `/app/loja/produtos/novo`: ProdutoForm criar.
- `/app/loja/produtos/[id]`: detalhe + ProdutoForm editar.
- `/app/loja/pedidos`: PedidosList com filtros.
- `/app/loja/pedidos/[id]`: PedidoDetalhe.
- `/app/loja/configuracoes`: leitura de envs PIX_* (read-only — Pedro editaria via Vercel) + info banco/entrega texto.

- [ ] **Step 6: typecheck + lint**

- [ ] **Step 7: Commit**

```bash
git add src/features/loja/components/admin/ src/app/(admin)/app/loja/
git commit -m "feat(sprint-6): fase H — admin loja (produtos + pedidos + confirmar pagamento)"
```

---

## Fase 6I — SEO + dashboard + bottom-nav + env + TODO WhatsApp

**Files:**
- Create: `src/shared/seo/default-meta.ts`
- Create: `src/shared/seo/product-jsonld.ts`
- Create: `src/app/(public)/sitemap.ts`
- Create: `src/app/(public)/robots.ts`
- Modify: `src/app/(admin)/app/page.tsx` (card pedidos pendentes loja)
- Modify: `src/components/shell/bottom-nav.tsx` (link Loja no item Mais ou substituir slot — decisão na execução)
- Modify: `.env.local.template`
- Modify: `src/app/(public)/checkout/actions.ts` + `src/features/loja/actions.ts` — confirmar TODO(sprint-5) inline

- [ ] **Step 1: default-meta.ts**

Helper para gerar Metadata default com OG, Twitter, canonical baseado em `NEXT_PUBLIC_SITE_URL` (env).

- [ ] **Step 2: product-jsonld.ts**

Função que gera JSON-LD schema.org Product:
```ts
export function productJsonLd(produto: { titulo: string; descricao?: string; preco: number; fotos: string[]; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.titulo,
    description: produto.descricao,
    image: produto.fotos,
    offers: { "@type": "Offer", price: produto.preco, priceCurrency: "BRL", availability: "https://schema.org/InStock" },
  };
}
```

Renderizar via `<script type="application/ld+json">{JSON.stringify(...)}</script>` em `/produto/[slug]`.

- [ ] **Step 3: sitemap.ts**

```ts
import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("produtos_loja")
    .select("slug, atualizado_em")
    .eq("status", "ativo");
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sistema-oficina-pedrored.vercel.app";
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/produtos`, lastModified: new Date(), priority: 0.9 },
    ...(data ?? []).map((p) => ({
      url: `${base}/produto/${p.slug}`,
      lastModified: new Date(p.atualizado_em),
      priority: 0.7,
    })),
  ];
}
```

- [ ] **Step 4: robots.ts**

```ts
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sistema-oficina-pedrored.vercel.app";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/checkout/pagamento", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

- [ ] **Step 5: Dashboard card "Pedidos pendentes"**

```tsx
// app/(admin)/app/page.tsx
const [pedidosPendentes] = await Promise.all([
  // existing parallel calls
  supabase.from("pedidos_loja").select("id", { count: "exact", head: true })
    .in("status", ["aguardando_pagamento", "pagamento_em_analise"]).then(r => r.count ?? 0),
]);
// Adicionar card "Pedidos pendentes" -> /app/loja/pedidos
```

(Ajustar usando helper de queries em features/loja.)

- [ ] **Step 6: Bottom-nav**

Hoje bottom-nav tem 5 slots fixos: Início / OS / Estoque / Agenda / Mais. "Mais" vai pra `/app/mais` (que pode ainda não existir). Decisão:
- Criar `/app/mais/page.tsx` (se não existe) listando atalhos para Loja, Financeiro, Fornecedores, Clientes, Veículos, Pedidos Fornecedor.
- Garantir que `/app/loja` aparece nessa página.

- [ ] **Step 7: .env.local.template**

Acrescentar:
```bash
# Sprint 6 — PedroRed Store
NEXT_PUBLIC_SITE_URL=https://sistema-oficina-pedrored.vercel.app
PIX_CHAVE=pedro@example.com            # placeholder — substituir pela chave PIX real
PIX_NOME_BENEFICIARIO=Pedro Silva      # placeholder
PIX_CIDADE=Cidade                      # placeholder
```

- [ ] **Step 8: TODO(sprint-5) reforço**

Garantir comentário em `criarPedido` e em `confirmarPagamento` documentando ponto de integração WhatsApp.

- [ ] **Step 9: typecheck + lint + build**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

- [ ] **Step 10: Commit**

```bash
git add src/shared/seo/ src/app/(public)/sitemap.ts src/app/(public)/robots.ts \
        src/app/(admin)/app/page.tsx src/components/shell/bottom-nav.tsx \
        src/app/(admin)/app/mais/ .env.local.template
git commit -m "feat(sprint-6): fase I — SEO + dashboard + bottom-nav + env placeholders + TODOs"
```

---

## Fase 6J — Testes E2E + docs Sprint 6 + overview

**Files:**
- Create: `e2e/sprint-06-store.spec.ts`
- Modify: `docs/architecture/data-model.md` (tabelas loja)
- Modify: `docs/architecture/deploy.md` (buckets loja-produtos/comprovantes)
- Modify: `docs/00-overview.md` (Sprint 3 → ✅ Romero proxy; Sprint 6 → 🟢 aguardando Pedro)
- Modify: `docs/sprints/sprint-06-store.md` (Progresso preenchido)

- [ ] **Step 1: e2e/sprint-06-store.spec.ts**

Cenários (em viewport mobile 375×667):
1. Admin loga, cria produto "Filtro de óleo MANN W712" vinculado a item de estoque (criado na Sprint 3 e2e ou seed); upload de 1 foto mock.
2. Logout. Visita `/` → vê produto em destaque.
3. Acessa `/produto/filtro-de-oleo-mann-w712` → adiciona ao carrinho.
4. Abre `/carrinho` → vê item, vai para `/checkout`.
5. Preenche form, submit → redireciona para `/checkout/pagamento`.
6. Página de pagamento mostra QR (canvas existe), código PIX copiável.
7. Upload comprovante mock (arquivo png pequeno gerado no test).
8. Login admin → `/app/loja/pedidos` → ver pedido em `pagamento_em_analise`.
9. Abrir detalhe → "Confirmar pagamento" com baixar_estoque=true.
10. Verificar estoque (`/app/estoque/[id]`) reduziu pela qtd.

```bash
pnpm e2e --grep sprint-06
```

Expected: 10 PASS.

- [ ] **Step 2: data-model.md**

Adicionar tabelas Sprint 6 (produtos_loja, pedidos_loja, itens_pedido_loja), função gerar_slug_unico, FK movimentacoes_estoque.pedido_loja_id, buckets storage.

- [ ] **Step 3: deploy.md**

Adicionar seção sobre buckets criados, política loja-comprovantes anon insert, env vars PIX e NEXT_PUBLIC_SITE_URL.

- [ ] **Step 4: 00-overview.md tabela**

| 3 | Estoque | ✅ validada | sprint-03-06 | ✅ Romero (proxy) data |
| 6 | PedroRed Store | 🟢 implementada | sprint-03-06 | aguardando Pedro |

(Atualizar "Sprint corrente: 6")

- [ ] **Step 5: sprint-06-store.md "Progresso"**

Marcar todas as verificações que passaram. Itens não cobertos (PIX real, domínio): nota explícita "placeholder — Pedro precisa fornecer".

- [ ] **Step 6: Full verification**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm e2e
```

Expected: tudo verde.

- [ ] **Step 7: Commit**

```bash
git add e2e/sprint-06-store.spec.ts docs/
git commit -m "docs(sprint-6): fase J — e2e loja + atualizar overview/data-model/deploy"
```

---

## Pós-execução — push + PR

Apenas após **todas as fases 3A-3H + 6A-6J verdes**:

```bash
git push -u origin sprint-03-06
```

Abrir PR no GitHub (URL printada pelo push). Título: `feat: Sprint 3 (Estoque) + Sprint 6 (PedroRed Store)`. Body: link para os dois sprint .md, lista de fases, e checklist de manual testing pendente para Pedro:
- Estoque: cadastrar item real, lançar entrada, criar OS com peça do estoque, ver baixa.
- Loja: cadastrar 10 produtos, divulgar link, simular venda real.

⚠️ **Vercel deploy automático** ocorre no merge para `main` (memória do projeto). Antes de mergear, Romero deve configurar env vars `PIX_CHAVE`, `PIX_NOME_BENEFICIARIO`, `PIX_CIDADE` em Vercel Settings (mesmo que placeholders).

---

## Resumo de comandos

```bash
# Tests
pnpm typecheck
pnpm lint
pnpm test
pnpm test src/features/estoque/integration.test.ts -- --run
pnpm test src/features/loja/pix.test.ts -- --run
pnpm test src/features/loja/components/publico/carrinho-store.test.ts -- --run

# DB
pnpm db:migrate
pnpm db:gen

# Dev / E2E / Build
pnpm dev
pnpm e2e --grep sprint-03
pnpm e2e --grep sprint-06
pnpm build
```

---

## Self-Review

**Spec coverage Sprint 3:**
- Cadastro item, lista com filtros, entrada/saída/ajuste, custo médio, alerta_minimo, view → Fases 3A/3B/3C ✓
- Categorias CRUD → 3D ✓
- ItemCombobox no OS + trigger baixa → 3E ✓
- Pedido fornecedor recebido lança entradas → 3F ✓
- Dashboard alerta + bottom-nav ativo → 3G ✓
- Testes unit/integration/e2e → 3B/3E/3H ✓
- Docs atualizadas → 3H ✓

**Spec coverage Sprint 6:**
- Schema (produtos_loja, pedidos_loja, itens_pedido_loja, slug fn, buckets, policies) → 6A ✓
- PIX BR Code TDD → 6B ✓
- Carrinho localStorage → 6C ✓
- Schemas/queries (público + admin) → 6D ✓
- Actions público (criarPedido, uploadComprovante via service_role) → 6E ✓
- Actions admin (CRUD produto, confirmarPagamento+baixa estoque, cancelar, status) → 6F ✓
- Páginas + componentes públicos (home, catálogo, produto, carrinho, checkout, pagamento, pedido) → 6G ✓
- Páginas + componentes admin (loja, produtos, pedidos, configuracoes) → 6H ✓
- SEO (metadata, sitemap, robots, json-ld) + dashboard + bottom-nav + env → 6I ✓
- TODO WhatsApp marcado in-code → 6E + 6I ✓
- Testes e2e + docs → 6J ✓

**Gaps assumidos pelo plano:**
- Sem `loja_select_publico` específico para `produtos_loja.fotos` no Storage: usamos bucket público — qualquer URL é acessível. OK para MVP.
- `confirmarPagamento` com `baixarEstoque=true` pode falhar parcialmente (alguns RPCs OK, outros falham). MVP retorna primeiro erro; refinar se virar dor real.
- `criarPedido` não valida estoque na hora — pode prometer mais do que tem. Decisão MVP (sprint-06.md §Decisões): validação manual ao confirmar pagamento.
- E2E Sprint 6 assume seed/cadastro local de item estoque + foto mock — implementado dentro do próprio spec.
- Bottom-nav: pode existir slot dedicado Estoque ainda — se a página `/app/mais` não existir, criamos.

**Placeholder scan:** OK — todos os "TODO(sprint-5)" são intencionais e documentados; todos os env vars com placeholder são intencionais e documentados em `.env.local.template`.

**Type consistency:** `aplicar_movimentacao_estoque` assinatura idêntica em 3B/3E/3F/6F. `MovimentacaoTipo` enum usado consistentemente. `ActionResult<T>` mesmo shape em todas as features.
