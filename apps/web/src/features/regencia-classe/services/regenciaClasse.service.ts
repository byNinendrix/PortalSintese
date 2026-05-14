import type { RegenciaClasseResponse } from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

class RegenciaClasseService {
  async getRegenciaClasse(cpf: string): Promise<RegenciaClasseResponse> {
    const cpfDigits = normalizeCpf(cpf);

    if (USE_MOCKS) {
      return {
        cpf: `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`,
        nome: "Filiado(a) SINTESE",
        dataNascimento: "1985-07-11",
        valorTotal: 1500,
        hasData: true,
        registros: [
          {
            valor: 1500,
            nome: "Filiado(a) SINTESE",
            cpf: cpfDigits,
            dataNascimento: "1985-07-11"
          }
        ]
      };
    }

    const query = new URLSearchParams({ cpf: cpfDigits }).toString();
    return apiRequest<RegenciaClasseResponse>(`/users/regencia-classe?${query}`);
  }
}

export const regenciaClasseService = new RegenciaClasseService();

