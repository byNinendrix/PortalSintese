import type { ConvenioDetail } from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";
import { mockListConvenios, mockListRamosAtividade } from "../mocks/convenios.mock";

export interface ConveniosFilters {
  ramo?: string;
  parceiro?: string;
}

export interface ConveniosService {
  list(filters?: ConveniosFilters): Promise<ConvenioDetail[]>;
  listRamosAtividade(): Promise<string[]>;
}

class ConveniosServiceImpl implements ConveniosService {
  async list(filters?: ConveniosFilters): Promise<ConvenioDetail[]> {
    if (USE_MOCKS) {
      return mockListConvenios(filters);
    }

    const searchParams = new URLSearchParams();
    if (filters?.ramo) searchParams.set("ramo", filters.ramo);
    if (filters?.parceiro) searchParams.set("parceiro", filters.parceiro);
    const query = searchParams.toString();
    return apiRequest<ConvenioDetail[]>(`/convenios${query ? `?${query}` : ""}`);
  }

  async listRamosAtividade(): Promise<string[]> {
    if (USE_MOCKS) {
      return mockListRamosAtividade();
    }
    return apiRequest<string[]>("/convenios/ramo-atividade");
  }
}

export const conveniosService: ConveniosService = new ConveniosServiceImpl();
