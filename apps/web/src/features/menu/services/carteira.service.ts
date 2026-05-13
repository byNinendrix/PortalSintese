import type { CarteiraResponse } from "@sintese/types";
import { apiRequest } from "../../../shared/services/apiClient";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

class CarteiraService {
  async prepararCarteira(cpf: string): Promise<CarteiraResponse> {
    const cpfDigits = normalizeCpf(cpf);
    const query = new URLSearchParams({ cpf: cpfDigits }).toString();
    return apiRequest<CarteiraResponse>(`/users/carteira?${query}`);
  }
}

export const carteiraService = new CarteiraService();

