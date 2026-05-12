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
    mapsShareUrl: "https://share.google/C10nmYooVJJVGqW6c",
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
  return CONTATO.endereco.mapsShareUrl;
}

export function getMapsEmbedUrl(): string {
  const query = encodeURIComponent(getEnderecoCompleto());
  return `https://www.google.com/maps?q=${query}&z=16&output=embed`;
}
