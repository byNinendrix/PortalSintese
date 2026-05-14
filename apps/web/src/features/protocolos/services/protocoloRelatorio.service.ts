import type { ProtocoloRelatorioResponse } from "@sintese/types";
import { apiRequest } from "../../../shared/services/apiClient";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

class ProtocoloRelatorioService {
  async getRelatorio(protocolo: string, cpf: string): Promise<ProtocoloRelatorioResponse> {
    const params = new URLSearchParams({
      protocolo: protocolo.trim(),
      cpf: normalizeCpf(cpf)
    });
    return apiRequest<ProtocoloRelatorioResponse>(`/users/protocolos/relatorio?${params.toString()}`);
  }
}

export const protocoloRelatorioService = new ProtocoloRelatorioService();

