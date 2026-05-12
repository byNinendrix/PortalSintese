export type Cpf = string;

export interface AuthLoginRequest {
  cpf: Cpf;
  password: string;
}

export interface AuthTokensResponse {
  cpf: Cpf;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isFiliadoAtivo: boolean;
  associado: string | null;
  modeloCarteira: string | null;
}

export interface AuthSessionDebugResponse {
  cpf: Cpf;
  isFiliadoAtivo: boolean;
  associado: string | null;
  modeloCarteira: string | null;
  checkedAt: string;
}

export interface ResetOwnPasswordRequest {
  cpf: Cpf;
  newPassword: string;
}

export interface ResetOwnPasswordResponse {
  success: true;
  message: string;
}

export interface LgpdTermoResponse {
  cpf: Cpf;
  nome: string;
  termo: string;
  autorizaLgpd: boolean;
}

export interface LgpdAceiteRequest {
  cpf: Cpf;
}

export interface LgpdAceiteResponse {
  success: true;
  message: string;
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

export interface UserProfileResponse {
  cpf: Cpf;
  nome: string;
}

export interface FiliacaoSummary {
  cpf: Cpf;
  situacao: string;
  matricula: string;
  codigoEmpresa: string;
  descricaoEmpresa: string;
  codigoPredio: string;
  descricaoPredio: string;
  regiao: string;
  tempoFiliacao: string;
}

export interface FichaCadastralPessoa {
  cpfOculto: string | null;
  nome: string | null;
  pai: string | null;
  mae: string | null;
  naturalidade: string | null;
  nacionalidade: string | null;
  rgOculto: string | null;
  dataExpRg: string | null;
  tituloEleitor: string | null;
  sexo: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  celular: string | null;
  dataNascimento: string | null;
  dataEmisCarteira: string | null;
  dataValCarteira: string | null;
  autorizaEmail: string | null;
  email: string | null;
  dataInclusao: string | null;
  nascimentoExtenso: string | null;
  estadoCivilDescricao: string | null;
  instrucao: string | null;
  complemento: string | null;
  racaDescricao: string | null;
  numero: string | null;
  qrCodeFicha: string | null;
  fotoImg: string | null;
}

export interface FichaCadastralFiliacao {
  situacao: string | null;
  matricula: string | null;
  descEmpresa: string | null;
  descPredio: string | null;
  filiado: string | null;
  dataSindicalizacao: string | null;
  dataDesfiliacao: string | null;
}

export interface FichaCadastralDependente {
  nome: string | null;
  sexo: string | null;
  dataNascimento: string | null;
  parentesco: string | null;
  cpfDependente: string | null;
}

export interface FichaCadastralSindicato {
  cnpj: string | null;
  razaoSocial: string | null;
  fantasia: string | null;
  logoImg: string | null;
}

export interface FichaCadastralResponse {
  cpf: Cpf;
  usuario: string;
  generatedAt: string;
  pessoa: FichaCadastralPessoa;
  filiacoes: FichaCadastralFiliacao[];
  dependentes: FichaCadastralDependente[];
  sindicato: FichaCadastralSindicato | null;
}

export interface AtualizarDadosPessoaResponse {
  cpf: Cpf;
  nome: string;
  fotoPerfilUrl: string | null;
  pai: string;
  mae: string;
  naturalidade: string;
  ufNaturalidade: string;
  nacionalidade: string;
  fatorHr: string;
  rg: string;
  rgOrgao: string;
  rgUf: string;
  dataExpRg: string | null;
  tituloEleitor: string;
  sexo: string;
  estadoCivil: string;
  telefone: string;
  celular: string;
  dataNascimento: string | null;
  grauInstrucao: string;
  cartProfissional: string;
  email: string;
  raca: string;
  sangueTpRh: string;
  celularIi: string;
  enderecoAcr: string;
  complementoAcr: string;
  bairroAcr: string;
  cidadeAcr: string;
  estadoAcr: string;
  cepAcr: string;
  numeroAcr: string;
  idPessoa: string;
  nomeSocial: string;
  especificarGenero: string;
  orientacaoSexual: string;
}

export interface UpdateUserDataRequest {
  cpf: Cpf;
  nome: string;
  sangueTpRh: string;
  rg: string;
  dataExpRg: string;
  rgOrgao: string;
  rgUf: string;
  nomeSocial: string;
  dataNascimento: string;
  sexo: string;
  especificarGenero: string;
  orientacaoSexual: string;
  estadoCivil: string;
  raca: string;
  mae: string;
  pai: string;
  telefone: string;
  celular: string;
  celularIi: string;
  cepAcr: string;
  enderecoAcr: string;
  numeroAcr: string;
  bairroAcr: string;
  complementoAcr: string;
  estadoAcr: string;
  cidadeAcr: string;
  fotoPerfilBase64?: string;
  confirmarSubstituicaoSolicitacaoEndereco?: boolean;
}

export interface UpdateUserDataResponse {
  success: true;
  message: string;
}

export interface LookupOption {
  value: string;
  label: string;
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
