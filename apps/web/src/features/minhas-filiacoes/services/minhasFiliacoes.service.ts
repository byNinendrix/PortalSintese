import type { FiliacaoSummary, UserProfileResponse } from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";
import { readCachedUserProfile, saveCachedUserProfile } from "../../auth/services/authSession";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

class MinhasFiliacoesService {
  private isNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    return error.message.includes("404");
  }

  async getUserProfile(cpf: string): Promise<UserProfileResponse> {
    const cpfDigits = normalizeCpf(cpf);

    const cached = readCachedUserProfile(cpfDigits);
    if (cached) {
      return cached;
    }

    if (USE_MOCKS) {
      const mocked: UserProfileResponse = {
        cpf: `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`,
        nome: "Filiado(a) SINTESE"
      };
      saveCachedUserProfile(mocked);
      return mocked;
    }

    const query = new URLSearchParams({ cpf: cpfDigits }).toString();

    let profile: UserProfileResponse;
    try {
      profile = await apiRequest<UserProfileResponse>(`/users/profile?${query}`);
    } catch (error) {
      if (!this.isNotFoundError(error)) {
        throw error;
      }

      const lgpdProfile = await apiRequest<{ cpf: string; nome: string }>(`/lgpd/termo?${query}`);
      profile = {
        cpf: lgpdProfile.cpf,
        nome: lgpdProfile.nome
      };
    }

    saveCachedUserProfile(profile);
    return profile;
  }

  async getFiliacoes(cpf: string): Promise<FiliacaoSummary[]> {
    const cpfDigits = normalizeCpf(cpf);

    if (USE_MOCKS) {
      return [
        {
          cpf: `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`,
          situacao: "ATIVO",
          matricula: "3291",
          codigoEmpresa: "0001",
          descricaoEmpresa: "MUNICÍPIO DE AMPARO DO SÃO FRANCISCO",
          codigoPredio: "00028012623",
          descricaoPredio: "CRECHE MAE EMILIA",
          regiao: "BAIXO SÃO FRANCISCO I",
          tempoFiliacao: "3 meses e 22 dias"
        }
      ];
    }

    const query = new URLSearchParams({ cpf: cpfDigits }).toString();
    return apiRequest<FiliacaoSummary[]>(`/users/filiacoes?${query}`);
  }
}

export const minhasFiliacoesService = new MinhasFiliacoesService();
