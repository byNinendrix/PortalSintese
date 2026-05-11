import type { LgpdAceiteResponse, LgpdTermoResponse } from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";

export interface LgpdService {
  consultarTermo(cpf: string): Promise<LgpdTermoResponse>;
  aceitarTermo(cpf: string): Promise<LgpdAceiteResponse>;
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

const MOCK_TERMO = `TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS

Pelo presente instrumento, o(a) filiado(a) manifesta livremente que foi informado(a) de modo inequívoco e que concorda com o tratamento de seus dados pessoais para finalidades sindicais e administrativas, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).`;

class LgpdServiceImpl implements LgpdService {
  private isNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    return error.message.includes("404");
  }

  async consultarTermo(cpf: string): Promise<LgpdTermoResponse> {
    const cpfDigits = normalizeCpf(cpf);

    if (USE_MOCKS) {
      return {
        cpf: `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`,
        nome: "Filiado(a) SINTESE",
        termo: MOCK_TERMO,
        autorizaLgpd: false
      };
    }

    const query = new URLSearchParams({ cpf: cpfDigits }).toString();

    try {
      return await apiRequest<LgpdTermoResponse>(`/lgpd/termo?${query}`);
    } catch (error) {
      if (!this.isNotFoundError(error)) {
        throw error;
      }
      return apiRequest<LgpdTermoResponse>(`/auth/lgpd/termo?${query}`);
    }
  }

  async aceitarTermo(cpf: string): Promise<LgpdAceiteResponse> {
    const cpfDigits = normalizeCpf(cpf);

    if (USE_MOCKS) {
      return {
        success: true,
        message: "A aceitação dos termos da L.G.P.D já foi registrada com sucesso! Obrigado por sua conformidade!"
      };
    }

    try {
      return await apiRequest<LgpdAceiteResponse>("/lgpd/aceitar", {
        method: "POST",
        body: JSON.stringify({ cpf: cpfDigits })
      });
    } catch (error) {
      if (!this.isNotFoundError(error)) {
        throw error;
      }
      return apiRequest<LgpdAceiteResponse>("/auth/lgpd/aceitar", {
        method: "POST",
        body: JSON.stringify({ cpf: cpfDigits })
      });
    }
  }
}

export const lgpdService: LgpdService = new LgpdServiceImpl();
