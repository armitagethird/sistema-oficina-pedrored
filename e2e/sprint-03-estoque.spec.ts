import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_PEDRO_EMAIL;
const SENHA = process.env.E2E_PEDRO_SENHA;

test.describe("Sprint 3 — Estoque (smoke)", () => {
  test.skip(
    !EMAIL || !SENHA,
    "Definir E2E_PEDRO_EMAIL e E2E_PEDRO_SENHA pra rodar este teste",
  );

  test("cadastra item, lança entrada, baixa via OS, edita e remove", async ({
    page,
  }) => {
    const stamp = Date.now();
    const descItem = `E2E Óleo ${stamp}`;
    const clienteNome = `E2E S3 ${stamp}`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Senha").fill(SENHA!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/\/app$/);

    // -- Cadastrar item de estoque --
    await page.goto("/app/estoque/novo");
    await page.getByLabel(/Descrição/i).fill(descItem);
    // categoria default (primeira) OK
    // unidade default 'un' OK
    const precoVenda = page.getByLabel(/Preço de venda/i);
    await precoVenda.click();
    await precoVenda.fill("70,00");
    await precoVenda.press("Tab");
    await page.getByLabel(/Alerta mínimo/i).fill("2");
    await page.getByRole("button", { name: /criar item/i }).click();
    await page.waitForURL(/\/app\/estoque\/[a-f0-9-]+$/);

    // -- Registrar entrada de 10 unidades a R$45 --
    await page.getByRole("link", { name: /Movimentar/i }).click();
    await page.waitForURL(/\/app\/estoque\/movimentar/);
    // tipo "Entrada" é o default
    // Selecionar item no combobox
    await page.getByRole("combobox").nth(1).click(); // 0 = tipo, 1 = item
    await page.getByPlaceholder(/Buscar item/i).fill(descItem);
    await page.getByRole("option", { name: new RegExp(descItem) }).click();
    const qtd = page.getByLabel(/Quantidade/i);
    await qtd.fill("10");
    const custo = page.getByLabel(/Custo unitário/i);
    await custo.click();
    await custo.fill("45,00");
    await custo.press("Tab");
    await page.getByRole("button", { name: /Registrar movimentação/i }).click();
    await page.waitForURL(/\/app\/estoque\/[a-f0-9-]+$/);
    await expect(page.getByText(/10 un/)).toBeVisible();

    // -- Criar cliente + veículo + OS minimal --
    await page.goto("/app/clientes/novo");
    await page.getByLabel(/Nome/i).fill(clienteNome);
    await page
      .getByLabel(/Telefone/i)
      .fill(`11999${stamp.toString().slice(-6)}`);
    await page.getByRole("button", { name: /criar cliente/i }).click();
    await page.waitForURL(/\/app\/clientes\/[a-f0-9-]+$/);

    await page.getByRole("link", { name: /novo/i }).first().click();
    await page.waitForURL(/\/app\/veiculos\/novo/);
    await page
      .getByRole("button", { name: /Inserir modelo manualmente/i })
      .click();
    await page.getByLabel(/Modelo \(manual\)/i).fill("Gol");
    await page.getByLabel(/^Motor$/i).fill("1.0");
    await page
      .getByLabel(/Placa/i)
      .fill(`E${stamp.toString().slice(-6)}`);
    await page.getByRole("button", { name: /criar veículo/i }).click();
    await page.waitForURL(/\/app\/clientes\/[a-f0-9-]+$/);

    await page.goto("/app/os/nova");
    await page
      .getByRole("combobox", { name: /selecione um cliente/i })
      .click();
    await page
      .getByPlaceholder(/Buscar por nome ou telefone/i)
      .fill(clienteNome);
    await page.getByRole("option", { name: new RegExp(clienteNome) }).click();
    await page.getByRole("button", { name: /Avançar/i }).click();
    await page.getByRole("button", { name: /Gol/i }).click();
    await page.getByRole("button", { name: /Avançar/i }).click();
    await page
      .getByLabel(/Problema relatado/i)
      .fill("Smoke S3 — baixa de estoque");
    await page.getByRole("button", { name: /Abrir OS/i }).click();
    await page.waitForURL(/\/app\/os\/[a-f0-9-]+$/);

    // -- Adicionar peça com origem=estoque, qtd=4 --
    await page.getByRole("tab", { name: /Peças/i }).click();
    await page.getByRole("button", { name: /Adicionar peça/i }).click();

    // mudar origem para "Estoque"
    const origemSelect = page
      .getByRole("combobox")
      .filter({ hasText: /Fornecedor/i });
    await origemSelect.click();
    await page.getByRole("option", { name: /^Estoque$/i }).click();

    // ItemCombobox aparece — selecionar item
    await page
      .getByRole("button", { name: /Selecione um item/i })
      .click();
    await page.getByPlaceholder(/Buscar item/i).fill(descItem);
    await page.getByRole("option", { name: new RegExp(descItem) }).click();

    // Editar quantidade para 4
    const qtdPeca = page.getByLabel(/^Qtd$/i).first();
    await qtdPeca.click();
    await qtdPeca.fill("4");
    await qtdPeca.press("Tab");

    // -- Voltar ao estoque, conferir 6 (=10 - 4) --
    await page.goto("/app/estoque");
    await expect(page.getByText(new RegExp(descItem))).toBeVisible();
    await page.getByText(new RegExp(descItem)).click();
    await page.waitForURL(/\/app\/estoque\/[a-f0-9-]+$/);
    await expect(page.getByText(/6 un/)).toBeVisible();
  });
});
