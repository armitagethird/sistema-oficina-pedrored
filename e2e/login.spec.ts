import { expect, test } from "@playwright/test";

test("página de login renderiza com título, descrição e form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByTestId("login-title")).toHaveText("Entrar");
  await expect(page.getByText("Acesse o sistema PedroRed")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
});

test("acesso a /app sem login redireciona para /login", async ({ page }) => {
  await page.goto("/app");
  await page.waitForURL(/\/login$/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/login$/);
});
