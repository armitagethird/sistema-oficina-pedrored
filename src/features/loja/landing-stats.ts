/**
 * Dados editáveis da landing pública.
 *
 * NÃO É VERDADE ABSOLUTA — todos os números abaixo são placeholders plausíveis.
 * Substitua pelos valores reais que o Pedro confirmar.
 */

export interface StatItem {
  label: string;
  value: string;
}

export interface ServicoItem {
  numero: string;
  titulo: string;
  descricao: string;
}

export interface DepoimentoItem {
  autor: string;
  carro: string;
  texto: string;
}

// TODO: substituir pelos números reais quando Pedro confirmar.
export const LANDING_STATS: StatItem[] = [
  { label: "carros atendidos", value: "+200" },
  { label: "anos de experiência", value: "+10" },
];

// TODO: revisar copy com Pedro antes de publicar.
export const LANDING_SERVICOS: ServicoItem[] = [
  {
    numero: "01",
    titulo: "Diagnóstico TSI / MSI",
    descricao:
      "Scan completo, leitura de DTCs e parecer técnico. Pedro examina o que outro mecânico passou batido.",
  },
  {
    numero: "02",
    titulo: "Manutenção programada",
    descricao:
      "Óleo, kit corrente, velas, bobinas e filtros — calendário por km com produtos certos pra cada motor.",
  },
];

// TODO: trocar por depoimentos reais quando coletar. Não inventar foto.
export const LANDING_DEPOIMENTOS: DepoimentoItem[] = [
  {
    autor: "Marcos S.",
    carro: "POLO TSI 2020",
    texto:
      "Levei pra Pedro depois de duas oficinas errarem o diagnóstico. Achou o problema em vinte minutos e resolveu no mesmo dia.",
  },
  {
    autor: "Renata L.",
    carro: "T-CROSS 1.4 2022",
    texto:
      "Confio no Pedro porque ele explica o que está fazendo, manda foto, cobra justo. Hoje só ele mexe no meu carro.",
  },
  {
    autor: "João V.",
    carro: "JETTA GLI 2021",
    texto:
      "Peça correta, instalação certa, no prazo combinado. Já indiquei pra todo mundo do clube TSI da cidade.",
  },
];

// TODO: confirmar horário real da oficina com Pedro.
export const LANDING_HORARIO = "SEG–SEX 08H–18H · SÁB 08H–12H";
