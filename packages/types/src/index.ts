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

export interface ProtocoloSummary {
  protocolo: string | null;
  cpf: Cpf;
  status: string;
  matricula01: string | null;
  codigoEmpresa01: string | null;
  empresa01: string | null;
  codigoPredio01: string | null;
  matricula02: string | null;
  codigoEmpresa02: string | null;
  empresa02: string | null;
  codigoPredio02: string | null;
  adicionarOutraFiliacao: boolean;
  fotoContracheque01: string | null;
  fotoContracheque02: string | null;
}

export interface RegenciaClasseItem {
  valor: number | null;
  nome: string | null;
  cpf: string | null;
  dataNascimento: string | null;
}

export interface RegenciaClasseResponse {
  cpf: Cpf;
  nome: string | null;
  dataNascimento: string | null;
  valorTotal: number | null;
  hasData: boolean;
  registros: RegenciaClasseItem[];
}

export interface ProtocoloRelatorioDetalhe {
  protocolo: string | null;
  nrProtocolo: string | null;
  cpf: string | null;
  nome: string | null;
  nomeSocial: string | null;
  especificarGenero: string | null;
  orientacaoSexual: string | null;
  sexoMaiusculo: string | null;
  pai: string | null;
  mae: string | null;
  naturalidade: string | null;
  rgOculto: string | null;
  dataExpRg: string | null;
  rgOrgao: string | null;
  rgUf: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  celular: string | null;
  celularIi: string | null;
  dataNascimento: string | null;
  emailMaiusculo: string | null;
  estadoCivil: string | null;
  dataRegistro: string | null;
  matriculaOrgao: string | null;
  cargaHorariaOrgao: string | null;
  admissaoOrgao: string | null;
  aposentadoriaOrgao: string | null;
  entePublico: string | null;
  codigoEmpresa: string | null;
  codigoPredio: string | null;
  situacaoFiliacao: string | null;
  situacaoFuncional: string | null;
  funcaoOrgao: string | null;
  cargoOrgao: string | null;
  nivelOrgao: string | null;
  profissaoOrgao: string | null;
  vinculoEmpregaticioOrgao: string | null;
  matriculaOrgaoI: string | null;
  admissaoOrgaoI: string | null;
  aposentadoriaOrgaoI: string | null;
  entePublicoI: string | null;
  codigoEmpresaI: string | null;
  codigoPredioI: string | null;
  situacaoOrgaoI: string | null;
  funcaoOrgaoI: string | null;
  cargoOrgaoI: string | null;
  nivelOrgaoI: string | null;
  profissaoOrgaoI: string | null;
  vinculoEmpregaticioOrgaoI: string | null;
  autorizarDesconto: string | null;
  termoLgpdConfirmacao: string | null;
  termoLgpdTexto: string | null;
  dataDescontoInss: string | null;
  numeroBeneficioInss: string | null;
  dataDescontoInssI: string | null;
  numeroBeneficioInssI: string | null;
  especieInss: string | null;
  especieInssI: string | null;
  descontarInssMaiusculo: string | null;
  descontarInssIMaiusculo: string | null;
  foto: string | null;
  fotoResidencia: string | null;
  fotoContracheque01: string | null;
  fotoContracheque02: string | null;
  fotoRgFrente: string | null;
  fotoRgVerso: string | null;
  fotoDocumento: string | null;
  ip: string | null;
}

export interface ProtocoloRelatorioSindicato {
  cnpj: string | null;
  razaoSocial: string | null;
  fantasia: string | null;
  logoImg: string | null;
  textoAutorizacaoDesconto: string | null;
}

export interface ProtocoloRelatorioResponse {
  generatedAt: string;
  detalhe: ProtocoloRelatorioDetalhe;
  sindicato: ProtocoloRelatorioSindicato | null;
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

export interface CarteiraResponse {
  cpf: Cpf;
  url: string;
  qrCodeCarteira: string | null;
  qrCodeFoiGerado: boolean;
  carteiraVencida: boolean;
  dataEmissaoCarteira: string | null;
  dataValidadeCarteira: string | null;
  anosValidadeCarteira: number;
  nome: string | null;
  cpfExtenso: string | null;
  cidadeCarteirinha: string | null;
  sangueTpRh: string | null;
  fotoImg: string | null;
  sindicato: {
    imgCartFrente: string | null;
    imgCartVerso: string | null;
  } | null;
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

export interface SolicitacaoFiliacaoBootstrapResponse {
  cpf: Cpf;
  solicitacaoStatus: "A" | "F" | null;
  hasDraftInProgress: boolean;
  nome: string;
  nomeSocial: string;
  pai: string;
  mae: string;
  naturalidade: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  telefone: string;
  celular: string;
  celularIi: string;
  dataNascimento: string | null;
  email: string;
  estadoCivil: string;
  especificarGenero: string;
  orientacaoSexual: string;
  sexo: string;
  rg: string;
  dataExpRg: string | null;
  sangueTpRh: string;
  rgOrgao: string;
  rgUf: string;
  raca: string;
  matriculaOrgao: string;
  codigoEmpresa: string;
  codigoPredio: string;
  situacaoFuncional: string;
  nivelSalarialOrgao: string;
  cargoOrgao: string;
  profissaoOrgao: string;
  funcaoOrgao: string;
  vinculoOrgao: string;
  cargaHorariaOrgao: string;
  admissaoOrgao: string | null;
  aposentadoriaOrgao: string | null;
  descontarInss: "N" | "S" | "";
  dataDescontoInss: string | null;
  numeroBeneficioInss: string;
  codigoEspecieInss: string;
  adicionarOutraFiliacao: boolean;
  matriculaOrgaoI: string;
  codigoEmpresaI: string;
  codigoPredioI: string;
  situacaoOrgaoI: string;
  nivelSalarialOrgaoI: string;
  cargoOrgaoI: string;
  profissaoOrgaoI: string;
  funcaoOrgaoI: string;
  vinculoOrgaoI: string;
  cargaHorariaOrgaoI: string;
  admissaoOrgaoI: string | null;
  aposentadoriaOrgaoI: string | null;
  descontarInssI: "N" | "S" | "";
  dataDescontoInssI: string | null;
  numeroBeneficioInssI: string;
  codigoEspecieInssI: string;
  autorizarDesconto: boolean;
  autorizarLgpd: boolean;
  termoLgpdConfirmacao: string;
  termoAutorizacaoDesconto: string;
  termoLgpdTexto: string;
  termoLgpdDataExtenso: string;
  fotoPerfilUrl: string | null;
  fotoResidenciaUrl: string | null;
  fotoContracheque01Url: string | null;
  fotoContracheque02Url: string | null;
  fotoDocumentoUrl: string | null;
  fotoRgFrenteUrl: string | null;
  fotoRgVersoUrl: string | null;
  fatoresSanguineos: LookupOption[];
}

export interface SolicitacaoFiliacaoVinculoLookupsResponse {
  empresas: LookupOption[];
  situacoesFuncionais: LookupOption[];
  niveisCarreira: LookupOption[];
  cargos: LookupOption[];
  funcoesMagisterio: LookupOption[];
  formacoesProfissionais: LookupOption[];
  regimesTrabalho: LookupOption[];
  especiesInss: LookupOption[];
}

export interface CreateSolicitacaoFiliacaoRequest {
  cpf: Cpf;
  nome: string;
  nomeSocial?: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  celular?: string;
  celularIi?: string;
  dataNascimento?: string;
  email?: string;
  estadoCivil?: string;
  especificarGenero?: string;
  orientacaoSexual?: string;
  sexo?: string;
  rg?: string;
  dataExpRg?: string;
  sangueTpRh?: string;
  rgOrgao?: string;
  rgUf?: string;
  raca?: string;
  matriculaOrgao?: string;
  codigoEmpresa?: string;
  codigoPredio?: string;
  nivelSalarialOrgao?: string;
  situacaoFuncional?: string;
  cargoOrgao?: string;
  funcaoOrgao?: string;
  profissaoOrgao?: string;
  vinculoOrgao?: string;
  cargaHorariaOrgao?: string;
  admissaoOrgao?: string;
  aposentadoriaOrgao?: string;
  adicionarOutraFiliacao?: boolean;
  matriculaOrgaoI?: string;
  codigoEmpresaI?: string;
  codigoPredioI?: string;
  nivelSalarialOrgaoI?: string;
  situacaoOrgaoI?: string;
  cargoOrgaoI?: string;
  funcaoOrgaoI?: string;
  profissaoOrgaoI?: string;
  vinculoOrgaoI?: string;
  cargaHorariaOrgaoI?: string;
  admissaoOrgaoI?: string;
  aposentadoriaOrgaoI?: string;
  autorizarDesconto?: boolean;
  autorizarLgpd?: boolean;
  termoLgpd?: string;
  descontarInss?: "N" | "S";
  dataDescontoInss?: string;
  numeroBeneficioInss?: string;
  codigoEspecieInss?: string;
  descontarInssI?: "N" | "S";
  dataDescontoInssI?: string;
  numeroBeneficioInssI?: string;
  codigoEspecieInssI?: string;
  fotoPerfilBase64?: string;
  fotoResidenciaBase64?: string;
  fotoContracheque01Base64?: string;
  fotoContracheque02Base64?: string;
  fotoDocumentoBase64?: string;
  fotoRgFrenteBase64?: string;
  fotoRgVersoBase64?: string;
}

export interface CreateSolicitacaoFiliacaoResponse {
  success: true;
  protocolo: string;
  message: string;
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
