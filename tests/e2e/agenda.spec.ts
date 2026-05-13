import { test, expect } from "@playwright/test";

test.describe("Agenda", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/agenda");
  });

  test("exibe view do dia com períodos manhã e tarde", async ({ page }) => {
    await expect(page.getByText("Manhã")).toBeVisible();
    await expect(page.getByText("Tarde")).toBeVisible();
  });

  test("navega para criação de agendamento", async ({ page }) => {
    await page.getByRole("link", { name: /novo/i }).click();
    await expect(page).toHaveURL(/\/app\/agenda\/novo/);
    await expect(page.getByLabel("Cliente")).toBeVisible();
  });

  test("navega para view semanal", async ({ page }) => {
    await page.getByRole("link", { name: /semana/i }).click();
    await expect(page).toHaveURL(/\/app\/agenda\/semana/);
  });

  test("navega para view mensal", async ({ page }) => {
    await page.getByRole("link", { name: /mês/i }).click();
    await expect(page).toHaveURL(/\/app\/agenda\/mes/);
  });
});
