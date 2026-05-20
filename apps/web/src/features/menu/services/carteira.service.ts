import type { CarteiraResponse } from "@sintese/types";
import { apiRequest } from "../../../shared/services/apiClient";
import type { CarteiraLayoutConfig } from "../../carteira/layout/carteiraLayout";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

class CarteiraService {
  async prepararCarteira(cpf: string): Promise<CarteiraResponse> {
    const cpfDigits = normalizeCpf(cpf);
    const query = new URLSearchParams({ cpf: cpfDigits }).toString();
    return apiRequest<CarteiraResponse>(`/users/carteira?${query}`);
  }

  async getCarteiraLayout(): Promise<Partial<CarteiraLayoutConfig> | null> {
    const response = await apiRequest<{ layout: Partial<CarteiraLayoutConfig> | null }>("/users/carteira-layout");
    return response.layout ?? null;
  }

  async saveCarteiraLayout(layout: CarteiraLayoutConfig): Promise<void> {
    await apiRequest<{ success: true }>("/users/carteira-layout", {
      method: "POST",
      body: JSON.stringify({ layout })
    });
  }
}

export const carteiraService = new CarteiraService();
