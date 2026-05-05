import { useQuery } from "@tanstack/react-query";
import type { ParceirosFilters } from "../services/parceiros.service";
import { parceirosService } from "../services/parceiros.service";

export function useParceirosQuery(filters?: ParceirosFilters) {
  return useQuery({
    queryKey: ["parceiros", filters],
    queryFn: () => parceirosService.list(filters)
  });
}

