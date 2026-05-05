import { useMutation } from "@tanstack/react-query";
import type { AuthLoginRequest, PasswordRecoveryRequest, UserRegistrationRequest } from "@sintese/types";
import { authService } from "../services/auth.service";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: AuthLoginRequest) => authService.login(payload)
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: UserRegistrationRequest) => authService.register(payload)
  });
}

export function useRecoverPasswordMutation() {
  return useMutation({
    mutationFn: (payload: PasswordRecoveryRequest) => authService.recoverPassword(payload)
  });
}

export function useCheckCpfExistsMutation() {
  return useMutation({
    mutationFn: (cpf: string) => authService.checkCpfExists(cpf)
  });
}
