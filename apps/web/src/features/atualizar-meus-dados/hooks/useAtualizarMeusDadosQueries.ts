import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserDataRequest } from "@sintese/types";
import { atualizarMeusDadosService } from "../services/atualizarMeusDados.service";

export function useAtualizarDadosPessoaQuery(cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["atualizar-meus-dados", "pessoa", cpf],
    queryFn: () => atualizarMeusDadosService.getDadosPessoa(cpf),
    enabled: enabled && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    staleTime: 0
  });
}

export function useAtualizarDadosLookupsQuery(ufCidade: string, enabled = true) {
  return useQuery({
    queryKey: ["atualizar-meus-dados", "lookups", ufCidade],
    queryFn: () => atualizarMeusDadosService.getLookups(ufCidade),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60
  });
}

export function useAtualizarDadosMutation(cpf: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserDataRequest) => atualizarMeusDadosService.updateDados(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["atualizar-meus-dados", "pessoa", cpf] });
    }
  });
}
