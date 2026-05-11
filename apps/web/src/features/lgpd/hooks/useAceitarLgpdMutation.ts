import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lgpdService } from "../services/lgpd.service";

export function useAceitarLgpdMutation(cpf: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => lgpdService.aceitarTermo(cpf),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-termo", cpf] });
    }
  });
}
