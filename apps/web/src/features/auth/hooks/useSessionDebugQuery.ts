import { useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useSessionDebugQuery(cpf: string, enabled = true) {
  return useQuery({
    queryKey: ["auth", "session-debug", cpf],
    queryFn: () => authService.getSessionDebug(cpf),
    enabled: enabled && Boolean(cpf),
    staleTime: 0,
    refetchOnWindowFocus: false
  });
}

