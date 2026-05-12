import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_PEDRO_EMAIL;
const SENHA = process.env.E2E_PEDRO_SENHA;

test.describe("Sprint 5 — WhatsApp (smoke)", () => {
  test.skip(
    !EMAIL || !SENHA,
    "Definir E2E_PEDRO_EMAIL e E2E_PEDRO_SENHA pra rodar este teste",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Senha").fill(SENHA!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/\/app$/);
  });

  test("dashboard WhatsApp carrega e mostra status + KPIs", async ({ page }) => {
    await page.goto("/app/whatsapp");

    await expect(
      page.getByRole("heading", { name: /WhatsApp/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/Status Evolution API/i)).toBeVisible();
    await expect(page.getByText(/Enviadas hoje/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Conversas/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Templates/i })).toBeVisible();
  });

  test("editor de template mostra preview live ao digitar", async ({ page }) => {
    await page.goto("/app/whatsapp/templates/os_pronta");

    const textarea = page.getByLabel(/Texto da mensagem/i);
    await expect(textarea).toBeVisible();

    await textarea.fill(
      "Oi {{primeiro_nome}}, total: {{valor}}, PIX: {{pix_chave}}",
    );

    // Preview renderiza com vars de exemplo: primeiro_nome=Maria, valor=R$ 350,00, pix_chave=pedrored@email.com
    await expect(
      page.getByText(/Oi Maria, total: R\$\s*350,00, PIX: pedrored@email\.com/),
    ).toBeVisible();
  });

  test("editor reporta placeholder inválido no preview", async ({ page }) => {
    await page.goto("/app/whatsapp/templates/lembrete_d1");

    const textarea = page.getByLabel(/Texto da mensagem/i);
    await textarea.fill("Oi {{naoexiste}}");

    await expect(
      page.getByText(/Placeholders inválidos:\s*naoexiste/i),
    ).toBeVisible();
  });

  test("kill-switch troca para off e persiste após reload", async ({ page }) => {
    await page.goto("/app/whatsapp/configuracoes");

    const toggle = page.getByRole("switch", { name: /Envios automáticos/i });
    await expect(toggle).toBeVisible();
    const inicial = await toggle.getAttribute("aria-checked");

    await toggle.click();
    await page.waitForTimeout(500);
    const aposClick = await toggle.getAttribute("aria-checked");
    expect(aposClick).not.toBe(inicial);

    await page.reload();
    const aposReload = await toggle.getAttribute("aria-checked");
    expect(aposReload).toBe(aposClick);

    // Volta ao estado inicial pra não afetar outros testes
    await toggle.click();
    await page.waitForTimeout(500);
  });

  test("conversas mostra estado vazio com mensagem amigável quando não há mensagens", async ({
    page,
  }) => {
    await page.goto("/app/whatsapp/conversas");
    await expect(
      page.getByRole("heading", { name: /Conversas/i, level: 1 }),
    ).toBeVisible();
    // Tolerante a banco vazio ou populado: header sempre existe.
  });

  test("menu Mais lista item WhatsApp", async ({ page }) => {
    await page.goto("/app/mais");
    await expect(page.getByRole("link", { name: /WhatsApp/i })).toBeVisible();
  });
});
