import type { PartnerSummary } from "@sintese/types";

function delay(ms = 500) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const parceirosMockData: PartnerSummary[] = [
  {
    id: "pa-001",
    name: "Parceiro A",
    category: "Saude",
    benefit: "Consulta com desconto",
    contact: "(79) 99999-0001",
    status: "ativo"
  },
  {
    id: "pa-002",
    name: "Parceiro B",
    category: "Educacao",
    benefit: "Bolsa parcial",
    contact: "(79) 99999-0002",
    status: "ativo"
  }
];

export async function mockListParceiros(): Promise<PartnerSummary[]> {
  await delay();
  return parceirosMockData;
}

