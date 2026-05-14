import { useQuery } from "@tanstack/react-query";
import { protocoloRelatorioService } from "../services/protocoloRelatorio.service";

export function useProtocoloRelatorioQuery(protocolo: string, cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["protocolos", "relatorio", protocolo, cpf],
    queryFn: () => protocoloRelatorioService.getRelatorio(protocolo, cpf),
    enabled: enabled && Boolean(protocolo) && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2
  });
}

