import { useQuery } from "@tanstack/react-query";
import { carteiraService } from "../../menu/services/carteira.service";

export function useCarteiraQuery(cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["carteira", cpf],
    queryFn: () => carteiraService.prepararCarteira(cpf),
    enabled: enabled && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5
  });
}

