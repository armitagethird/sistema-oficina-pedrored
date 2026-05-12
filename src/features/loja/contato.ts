export const CONTATO = {
  whatsapp: {
    href: "https://wa.me/55",
    label: "WhatsApp",
  },
  youtube: {
    handle: "@PEDROredtsi",
    canal: "https://www.youtube.com/@PEDROredtsi",
    channelId: process.env.YT_CHANNEL_ID ?? "UCwLMc5ERhoaghTLQ0aH7buA",
  },
  instagram: {
    handle: "@pedrored_oficial",
    url: "https://instagram.com/pedrored_oficial",
  },
  endereco: {
    logradouro: "R. São Benedito, 85",
    bairro: "Vila Vicente Fialho",
    cidade: "São Luís",
    estado: "MA",
    cep: "65073-590",
  },
  creditoDev: {
    nome: "Vibe Surf Dev",
    url: "https://vibesurfdev.com",
  },
} as const;

export function getEnderecoCompleto(): string {
  const { logradouro, bairro, cidade, estado, cep } = CONTATO.endereco;
  return `${logradouro} - ${bairro}, ${cidade} - ${estado}, ${cep}`;
}

export function getMapsUrl(): string {
  const query = encodeURIComponent(getEnderecoCompleto());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
