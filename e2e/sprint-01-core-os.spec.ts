import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_PEDRO_EMAIL;
const SENHA = process.env.E2E_PEDRO_SENHA;

test.describe("Sprint 1 — Core OS (smoke)", () => {
  test.skip(
    !EMAIL || !SENHA,
    "Definir E2E_PEDRO_EMAIL e E2E_PEDRO_SENHA pra rodar este teste",
  );

  test("jornada completa: login → cliente → veículo → OS → serviços+peça → status", async ({
    page,
  }) => {
    const stamp = Date.now();
    const clienteNome = `Teste E2E ${stamp}`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Senha").fill(SENHA!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/\/app$/);

    await page.goto("/app/clientes/novo");
    await page.getByLabel(/Nome/i).fill(clienteNome);
    await page.getByLabel(/Telefone/i).fill(`11999${stamp.toString().slice(-6)}`);
    await page.getByRole("button", { name: /criar cliente/i }).click();
    await page.waitForURL(/\/app\/clientes\/[a-f0-9-]+$/);

    await page.getByRole("link", { name: /novo/i }).first().click();
    await page.waitForURL(/\/app\/veiculos\/novo/);

    await page.getByRole("button", { name: /Inserir modelo manualmente/i }).click();
    await page.getByLabel(/Modelo \(manual\)/i).fill("Voyage");
    await page.getByLabel(/^Motor$/i).fill("1.6");
    await page.getByLabel(/Ano/i).fill("2020");
    await page.getByLabel(/Placa/i).fill(`ABC${stamp.toString().slice(-4)}`);
    await page.getByLabel(/KM atual/i).fill("50000");
    await page.getByRole("button", { name: /criar veículo/i }).click();
    await page.waitForURL(/\/app\/clientes\/[a-f0-9-]+$/);

    await page.goto("/app/os/nova");
    await page.getByRole("combobox", { name: /selecione um cliente/i }).click();
    await page.getByPlaceholder(/Buscar por nome ou telefone/i).fill(clienteNome);
    await page.getByRole("option", { name: new RegExp(clienteNome) }).click();
    await page.getByRole("button", { name: /Avançar/i }).click();

    await page.getByRole("button", { name: /Voyage/i }).click();
    await page.getByRole("button", { name: /Avançar/i }).click();

    await page.getByLabel(/Problema relatado/i).fill("Revisão completa E2E");
    await page.getByRole("button", { name: /Abrir OS/i }).click();
    await page.waitForURL(/\/app\/os\/[a-f0-9-]+$/);

    await expect(page.getByText(/OS #/)).toBeVisible();

    await page.getByRole("tab", { name: /Serviços/i }).click();
    await page.getByRole("button", { name: /Adicionar serviço/i }).click();
    await page.getByPlaceholder(/Ex: Troca de óleo/i).fill("Troca de óleo");

    await page.getByRole("tab", { name: /Peças/i }).click();
    await page.getByRole("button", { name: /Adicionar peça/i }).click();
    await page.getByPlaceholder(/Ex: Filtro de óleo/i).fill("Filtro de óleo");

    await page.getByRole("button", { name: /Avançar status/i }).click();
    await page.getByRole("menuitem", { name: /Em andamento/i }).click();
    await expect(page.getByText(/Em andamento/)).toBeVisible();
  });
});
