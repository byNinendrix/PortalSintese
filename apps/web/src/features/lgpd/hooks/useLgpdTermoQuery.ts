import { useQuery } from "@tanstack/react-query";
import { lgpdService } from "../services/lgpd.service";

export function useLgpdTermoQuery(cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["lgpd-termo", cpf],
    queryFn: () => lgpdService.consultarTermo(cpf),
    enabled: enabled && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false
  });
}
