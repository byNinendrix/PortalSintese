export type Cpf = string;

export interface AuthLoginRequest {
  cpf: Cpf;
  password: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserRegistrationRequest {
  cpf: Cpf;
  fullName: string;
  email?: string;
  whatsapp?: string;
  preferredChannel?: "email" | "whatsapp";
  password: string;
}

export interface PasswordRecoveryRequest {
  cpf: Cpf;
  preferredChannel: "email" | "whatsapp";
  email?: string;
  whatsapp?: string;
}

export interface PasswordRecoveryResponse {
  success: true;
  message: string;
}

export interface CpfCheckResponse {
  exists: boolean;
  email?: string | null;
  whatsapp?: string | null;
}

export interface ConvenioSummary {
  id: string;
  title: string;
  branchName: string;
  partnerName: string;
  description: string;
  status: "ativo" | "revisao" | "expirado";
  benefit: string;
}

export interface ConvenioDetail {
  cnpj: string;
  image: string | null;
  fantasia: string;
  endereco: string;
  bairro: string;
  numero: string;
  cidade: string;
  uf: string;
  cep: string;
  celular: string;
  desconto: string;
  telefone01: string;
  telefone02: string;
  cepNormal: string;
}

export interface PartnerSummary {
  id: string;
  name: string;
  category: string;
  benefit: string;
  contact: string;
  status: "ativo" | "inativo";
}
