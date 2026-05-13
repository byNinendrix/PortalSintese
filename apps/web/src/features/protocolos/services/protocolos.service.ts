import type { ProtocoloSummary } from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

class ProtocolosService {
  async getProtocolos(cpf: string): Promise<ProtocoloSummary[]> {
    const cpfDigits = normalizeCpf(cpf);

    if (USE_MOCKS) {
      return [
        {
          protocolo: "CB581B09-C4FD-4A67-9E89-066E8B0BF730",
          cpf: `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`,
          status: "Finalizado",
          matricula01: "1231231",
          codigoEmpresa01: "0003",
          empresa01: "MUNICIPIO DE ARACAJU",
          codigoPredio01: "0000",
          matricula02: null,
          codigoEmpresa02: null,
          empresa02: null,
          codigoPredio02: null,
          adicionarOutraFiliacao: false,
          fotoContracheque01: null,
          fotoContracheque02: null
        }
      ];
    }

    const query = new URLSearchParams({ cpf: cpfDigits }).toString();
    return apiRequest<ProtocoloSummary[]>(`/users/protocolos?${query}`);
  }
}

export const protocolosService = new ProtocolosService();

