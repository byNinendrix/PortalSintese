import { useQuery } from "@tanstack/react-query";
import { minhasFiliacoesService } from "../services/minhasFiliacoes.service";

export function useMinhaIdentificacaoQuery(cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["minhas-filiacoes", "identificacao", cpf],
    queryFn: () => minhasFiliacoesService.getUserProfile(cpf),
    enabled: enabled && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 15
  });
}
