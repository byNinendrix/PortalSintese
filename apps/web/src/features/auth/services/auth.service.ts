import type {
  AuthLoginRequest,
  AuthTokensResponse,
  CpfCheckResponse,
  PasswordRecoveryRequest,
  PasswordRecoveryResponse,
  ResetOwnPasswordRequest,
  ResetOwnPasswordResponse,
  UserRegistrationRequest
} from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";
import { mockLogin, mockRecoverPassword, mockRegister } from "../mocks/login.mock";

export interface AuthService {
  login(payload: AuthLoginRequest): Promise<AuthTokensResponse>;
  register(payload: UserRegistrationRequest): Promise<{ success: true }>;
  recoverPassword(payload: PasswordRecoveryRequest): Promise<PasswordRecoveryResponse>;
  resetPassword(payload: ResetOwnPasswordRequest): Promise<ResetOwnPasswordResponse>;
  checkCpfExists(cpf: string): Promise<CpfCheckResponse>;
}

class AuthServiceImpl implements AuthService {
  async login(payload: AuthLoginRequest): Promise<AuthTokensResponse> {
    if (USE_MOCKS) {
      return mockLogin(payload);
    }
    return apiRequest<AuthTokensResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async register(payload: UserRegistrationRequest): Promise<{ success: true }> {
    if (USE_MOCKS) {
      return mockRegister(payload);
    }
    return apiRequest<{ success: true }>("/users", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async recoverPassword(payload: PasswordRecoveryRequest): Promise<PasswordRecoveryResponse> {
    if (USE_MOCKS) {
      return mockRecoverPassword(payload);
    }
    return apiRequest<PasswordRecoveryResponse>("/auth/recover-password", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async resetPassword(payload: ResetOwnPasswordRequest): Promise<ResetOwnPasswordResponse> {
    if (USE_MOCKS) {
      return { success: true, message: "Senha atualizada com sucesso." };
    }

    return apiRequest<ResetOwnPasswordResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async checkCpfExists(cpf: string): Promise<CpfCheckResponse> {
    if (USE_MOCKS) {
      return { exists: false };
    }

    const query = new URLSearchParams({ cpf }).toString();
    return apiRequest<CpfCheckResponse>(`/users/check-cpf?${query}`);
  }
}

export const authService: AuthService = new AuthServiceImpl();
