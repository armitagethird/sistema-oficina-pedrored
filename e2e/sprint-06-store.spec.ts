import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_PEDRO_EMAIL;
const SENHA = process.env.E2E_PEDRO_SENHA;

test.describe("Sprint 6 — Loja PedroRed (smoke)", () => {
  test.skip(
    !EMAIL || !SENHA,
    "Definir E2E_PEDRO_EMAIL e E2E_PEDRO_SENHA pra rodar este teste",
  );

  test("home, catálogo e detalhe de produto carregam anonimamente", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(/PedroRed Store/i)).toBeVisible();

    await page.goto("/produtos");
    await expect(
      page.getByRole("heading", { name: /Catálogo/i }),
    ).toBeVisible();

    // robots.txt e sitemap.xml respondem
    const robots = await page.request.get("/robots.txt");
    expect(robots.status()).toBeLessThan(500);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.status()).toBeLessThan(500);
  });

  test("admin acessa /app/loja e dashboard de pedidos", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Senha").fill(SENHA!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/\/app$/);

    await page.goto("/app/loja");
    await expect(page.getByRole("heading", { name: "Loja" })).toBeVisible();
    await expect(page.getByText(/Pedidos pendentes/i)).toBeVisible();

    await page.goto("/app/loja/produtos");
    await expect(
      page.getByRole("heading", { name: /Produtos/i }),
    ).toBeVisible();

    await page.goto("/app/loja/configuracoes");
    await expect(page.getByText(/Chave PIX/i)).toBeVisible();
  });

  test("admin cria produto simples e ele aparece na loja pública", async ({
    page,
  }) => {
    const stamp = Date.now();
    const titulo = `E2E S6 Produto ${stamp}`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Senha").fill(SENHA!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/\/app$/);

    await page.goto("/app/loja/produtos/novo");
    await page.getByLabel(/Título/i).fill(titulo);
    const preco = page.getByLabel(/^Preço \*$/i);
    await preco.click();
    await preco.fill("99,00");
    await preco.press("Tab");
    await page.getByRole("button", { name: /Criar produto/i }).click();
    await page.waitForURL(/\/app\/loja\/produtos\/[a-f0-9-]+$/);

    // Loga out (via clear cookies) e visita catálogo público
    await page.context().clearCookies();
    await page.goto("/produtos");
    await expect(page.getByText(new RegExp(titulo))).toBeVisible();
  });
});
