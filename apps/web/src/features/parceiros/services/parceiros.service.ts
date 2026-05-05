import type { PartnerSummary } from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";
import { mockListParceiros } from "../mocks/parceiros.mock";

export interface ParceirosFilters {
  nome?: string;
  categoria?: string;
}

export interface ParceirosService {
  list(filters?: ParceirosFilters): Promise<PartnerSummary[]>;
}

class ParceirosServiceImpl implements ParceirosService {
  async list(filters?: ParceirosFilters): Promise<PartnerSummary[]> {
    if (USE_MOCKS) {
      return mockListParceiros();
    }

    const searchParams = new URLSearchParams();
    if (filters?.nome) searchParams.set("nome", filters.nome);
    if (filters?.categoria) searchParams.set("categoria", filters.categoria);
    const query = searchParams.toString();
    return apiRequest<PartnerSummary[]>(`/parceiros${query ? `?${query}` : ""}`);
  }
}

export const parceirosService: ParceirosService = new ParceirosServiceImpl();

