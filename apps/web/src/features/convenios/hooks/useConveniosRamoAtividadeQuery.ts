import { useQuery } from "@tanstack/react-query";
import { conveniosService } from "../services/convenios.service";

export function useConveniosRamoAtividadeQuery() {
  return useQuery({
    queryKey: ["convenios", "ramo-atividade"],
    queryFn: () => conveniosService.listRamosAtividade(),
    retry: false,
    refetchOnWindowFocus: false
  });
}
