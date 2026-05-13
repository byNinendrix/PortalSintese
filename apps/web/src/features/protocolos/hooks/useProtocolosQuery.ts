import { useQuery } from "@tanstack/react-query";
import { protocolosService } from "../services/protocolos.service";

export function useProtocolosQuery(cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["protocolos", "lista", cpf],
    queryFn: () => protocolosService.getProtocolos(cpf),
    enabled: enabled && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2
  });
}

