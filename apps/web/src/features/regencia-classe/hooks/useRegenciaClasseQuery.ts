import { useQuery } from "@tanstack/react-query";
import { regenciaClasseService } from "../services/regenciaClasse.service";

export function useRegenciaClasseQuery(cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["regencia-classe", cpf],
    queryFn: () => regenciaClasseService.getRegenciaClasse(cpf),
    enabled: enabled && Boolean(cpf),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5
  });
}

