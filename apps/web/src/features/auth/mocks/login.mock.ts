import type {
  AuthLoginRequest,
  AuthTokensResponse,
  PasswordRecoveryRequest,
  PasswordRecoveryResponse,
  UserRegistrationRequest
} from "@sintese/types";

function delay(ms = 400) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function mockLogin(_payload: AuthLoginRequest): Promise<AuthTokensResponse> {
  await delay();
  return {
    cpf: _payload.cpf,
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresIn: 900,
    isFiliadoAtivo: true,
    associado: "-1",
    modeloCarteira: null
  };
}

export async function mockRegister(_payload: UserRegistrationRequest): Promise<{ success: true }> {
  await delay();
  return { success: true };
}

export async function mockRecoverPassword(
  _payload: PasswordRecoveryRequest
): Promise<PasswordRecoveryResponse> {
  await delay();
  return { success: true, message: "Senha redefinida com sucesso." };
}
