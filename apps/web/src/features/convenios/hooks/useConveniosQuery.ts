import { useQuery } from "@tanstack/react-query";
import type { ConveniosFilters } from "../services/convenios.service";
import { conveniosService } from "../services/convenios.service";

export function useConveniosQuery(filters?: ConveniosFilters, enabled = true) {
  return useQuery({
    queryKey: ["convenios", filters],
    queryFn: () => conveniosService.list(filters),
    enabled,
    retry: false,
    refetchOnWindowFocus: false
  });
}
