/**
 * Gera o PIX BR Code estático (padrão EMV BACEN).
 *
 * Formato TLV: cada campo é Tag(2) + Length(2) + Value.
 * Campos canônicos:
 *   00 — Payload Format Indicator = "01"
 *   26 — Merchant Account Information (subTLVs: 00=GUI, 01=chave PIX)
 *   52 — Merchant Category Code = "0000"
 *   53 — Transaction Currency = "986" (BRL)
 *   54 — Transaction Amount (string com ponto decimal)
 *   58 — Country Code = "BR"
 *   59 — Merchant Name (até 25 chars ASCII)
 *   60 — Merchant City (até 15 chars ASCII)
 *   62 — Additional Data (subTLV 05 = txid, até 25 chars)
 *   63 — CRC16-CCITT (poly 0x1021, init 0xFFFF), hex uppercase 4 chars
 */

function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

export function calcularCrc16Pix(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type PixBRCodeArgs = {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  txid: string;
};

export function gerarPixBRCode(args: PixBRCodeArgs): string {
  const nome = normalize(args.nome).slice(0, 25);
  const cidade = normalize(args.cidade).slice(0, 15);
  const valor = args.valor.toFixed(2);
  const txid = normalize(args.txid).slice(0, 25) || "***";

  const merchantAccount = tlv("00", "br.gov.bcb.pix") + tlv("01", args.chave);
  const additionalData = tlv("05", txid);

  const payload =
    tlv("00", "01") +
    tlv("26", merchantAccount) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", valor) +
    tlv("58", "BR") +
    tlv("59", nome) +
    tlv("60", cidade) +
    tlv("62", additionalData) +
    "6304";

  return payload + calcularCrc16Pix(payload);
}
