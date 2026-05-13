import { describe, expect, it } from "vitest";

import {
  TemplateRenderError,
  extrairPlaceholders,
  primeiroNome,
  renderTemplate,
  vars,
} from "./templates";

describe("renderTemplate", () => {
  it("substitui placeholders válidos", () => {
    const out = renderTemplate("Olá {{primeiro_nome}}, valor: {{valor}}", {
      primeiro_nome: "João",
      valor: "R$ 100,00",
    });
    expect(out).toBe("Olá João, valor: R$ 100,00");
  });

  it("aceita espaços em volta do placeholder", () => {
    const out = renderTemplate("oi {{ nome }}!", { nome: "Maria" });
    expect(out).toBe("oi Maria!");
  });

  it("aborta com erro quando placeholder não pertence à lista oficial", () => {
    expect(() =>
      renderTemplate("Olá {{telefone_celular}}", {}),
    ).toThrow(TemplateRenderError);
    try {
      renderTemplate("Olá {{telefone_celular}}", {});
    } catch (err) {
      expect(err).toBeInstanceOf(TemplateRenderError);
      const e = err as TemplateRenderError;
      expect(e.placeholdersInvalidos).toEqual(["telefone_celular"]);
    }
  });

  it("em modo strict, aborta quando placeholder válido não recebe valor", () => {
    expect(() =>
      renderTemplate("Oi {{primeiro_nome}}, {{valor}}", {
        primeiro_nome: "João",
      }),
    ).toThrow(TemplateRenderError);
  });

  it("em modo não-strict, deixa placeholders sem valor como string vazia", () => {
    const out = renderTemplate(
      "Oi {{primeiro_nome}}, valor {{valor}}",
      { primeiro_nome: "João" },
      { strict: false },
    );
    expect(out).toBe("Oi João, valor ");
  });

  it("reporta todos os placeholders inválidos no erro", () => {
    try {
      renderTemplate("{{xpto}} e {{outro}}", {});
    } catch (err) {
      const e = err as TemplateRenderError;
      expect(e.placeholdersInvalidos).toEqual(
        expect.arrayContaining(["xpto", "outro"]),
      );
    }
  });
});

describe("extrairPlaceholders", () => {
  it("retorna lista única em ordem de aparição", () => {
    const out = extrairPlaceholders(
      "Oi {{nome}}, valor {{valor}}, de novo {{nome}}",
    );
    expect(out).toEqual(["nome", "valor"]);
  });

  it("retorna array vazio para texto sem placeholder", () => {
    expect(extrairPlaceholders("texto puro")).toEqual([]);
  });
});

describe("primeiroNome", () => {
  it("retorna primeiro pedaço antes do espaço", () => {
    expect(primeiroNome("Pedro Silva Vasconcelos")).toBe("Pedro");
  });

  it("trata nome com espaços extras", () => {
    expect(primeiroNome("  João   da Silva ")).toBe("João");
  });

  it("retorna vazio quando entrada é nula", () => {
    expect(primeiroNome(null)).toBe("");
    expect(primeiroNome(undefined)).toBe("");
    expect(primeiroNome("")).toBe("");
  });
});

describe("vars.paraLembreteD1", () => {
  it("formata data em pt-BR e mapeia periodo", () => {
    const result = vars.paraLembreteD1({
      nome: "João Silva",
      data: "2026-07-15",
      periodo: "manha",
    });
    expect(result.primeiro_nome).toBe("João");
    expect(result.nome).toBe("João Silva");
    expect(result.data).toBe("15/07");
    expect(result.periodo).toBe("manhã");
  });
});

describe("vars.paraOSPronta", () => {
  it("formata valor como BRL", () => {
    const result = vars.paraOSPronta({
      nome: "Maria Souza",
      valor: 1250.5,
      pixChave: "pedrored@email.com",
      osNumero: 42,
    });
    expect(result.primeiro_nome).toBe("Maria");
    expect(result.valor).toMatch(/R\$\s*1\.250,50/);
    expect(result.pix_chave).toBe("pedrored@email.com");
    expect(result.os_numero).toBe("42");
  });
});

describe("vars.paraCobranca", () => {
  it("inclui dias de atraso como string", () => {
    const result = vars.paraCobranca({
      nome: "Carlos",
      valor: 300,
      diasAtraso: 7,
      pixChave: "chave-pix",
    });
    expect(result.dias_atraso).toBe("7");
    expect(result.pix_chave).toBe("chave-pix");
    expect(result.valor).toMatch(/R\$\s*300,00/);
  });
});

describe("vars.paraLembreteOleo", () => {
  it("formata km em pt-BR", () => {
    const result = vars.paraLembreteOleo({ nome: "Pedro", kmEstimado: 105000 });
    expect(result.km_estimado).toBe("105.000");
  });
});

describe("integração render + vars (template real)", () => {
  it("renderiza template os_pronta com vars do helper", () => {
    const texto =
      "Olá {{primeiro_nome}}, seu carro está pronto! Valor: {{valor}}. PIX: {{pix_chave}}";
    const variaveis = vars.paraOSPronta({
      nome: "Ana Beatriz",
      valor: 450,
      pixChave: "00.000.000/0001-00",
    });
    const out = renderTemplate(texto, variaveis);
    expect(out).toMatch(/^Olá Ana,/);
    expect(out).toContain("PIX: 00.000.000/0001-00");
  });

  it("renderiza template cobranca_atraso_7 com pix", () => {
    const texto =
      "{{primeiro_nome}}: parcela {{valor}} atrasada {{dias_atraso}} dias. PIX: {{pix_chave}}";
    const variaveis = vars.paraCobranca({
      nome: "Bruno",
      valor: 150,
      diasAtraso: 7,
      pixChave: "+5511999999999",
    });
    expect(renderTemplate(texto, variaveis)).toContain(
      "atrasada 7 dias. PIX: +5511999999999",
    );
  });
});
