import type { ConvenioDetail } from "@sintese/types";
import type { ConveniosFilters } from "../services/convenios.service";

function delay(ms = 450) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const conveniosMockData: ConvenioDetail[] = [
  {
    cnpj: "12.345.678/0001-90",
    image: null,
    fantasia: "ACADEMIA PAULO BEDEU CLUB",
    endereco: "AV. JORGE AMADO",
    bairro: "JARDINS",
    numero: "1589",
    cidade: "ARACAJU",
    uf: "SE",
    cep: "49.080-200",
    celular: "(79) 99105-4604",
    desconto: "10% nos Planos Fitness no cartao de credito/debito; 15% nos Planos Fitness em dinheiro ou cheque.",
    telefone01: "(79) 3524-6565",
    telefone02: "",
    cepNormal: "49080200"
  },
  {
    cnpj: "98.765.432/0001-10",
    image: null,
    fantasia: "CINE CENTER",
    endereco: "RUA DAS FLORES",
    bairro: "CENTRO",
    numero: "450",
    cidade: "ARACAJU",
    uf: "SE",
    cep: "49.010-320",
    celular: "(79) 99888-7766",
    desconto: "20% de desconto em ingressos de segunda a quinta-feira.",
    telefone01: "(79) 3211-2233",
    telefone02: "",
    cepNormal: "49010320"
  }
];

export async function mockListConvenios(filters?: ConveniosFilters): Promise<ConvenioDetail[]> {
  await delay();
  if (!filters?.ramo) {
    return [];
  }
  return conveniosMockData;
}

export async function mockListRamosAtividade(): Promise<string[]> {
  await delay();
  return ["ENTRETENIMENTO", "ESPORTE"];
}
