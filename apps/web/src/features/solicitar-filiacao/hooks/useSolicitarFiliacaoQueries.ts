import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateSolicitacaoFiliacaoRequest } from "@sintese/types";
import { solicitarFiliacaoService } from "../services/solicitarFiliacao.service";

export function useSolicitarFiliacaoBootstrapQuery(cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["solicitar-filiacao", "bootstrap", cpf],
    queryFn: () => solicitarFiliacaoService.getBootstrap(cpf),
    enabled: enabled && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false
  });
}

export function useSolicitarFiliacaoLookupsQuery(uf: string, enabled = true) {
  return useQuery({
    queryKey: ["solicitar-filiacao", "lookups", uf],
    queryFn: () => solicitarFiliacaoService.getLookups(uf),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60
  });
}

export function useSolicitarFiliacaoMutation() {
  return useMutation({
    mutationFn: (payload: CreateSolicitacaoFiliacaoRequest) => solicitarFiliacaoService.create(payload)
  });
}
