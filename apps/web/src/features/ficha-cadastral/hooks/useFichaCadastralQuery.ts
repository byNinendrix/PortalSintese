import { useQuery } from "@tanstack/react-query";
import { fichaCadastralService } from "../services/fichaCadastral.service";

export function useFichaCadastralQuery(cpf: string, usuario?: string, enabled = true) {
  return useQuery({
    queryKey: ["ficha-cadastral", cpf, usuario],
    queryFn: () => fichaCadastralService.getFichaCadastral(cpf, usuario),
    enabled: enabled && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5
  });
}

