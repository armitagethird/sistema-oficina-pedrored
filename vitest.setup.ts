import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// O módulo `server-only` é resolvido via alias no vitest.config para um stub
// vazio (Next bloqueia a importação fora do servidor, mas em testes precisamos
// importar Server Actions e queries server-side).

// `next/cache` requer contexto de request do Next; mockamos como no-op.
vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
  unstable_cache: <T>(fn: T) => fn,
}));
