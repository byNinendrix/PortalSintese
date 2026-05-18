import type {
  CreateSolicitacaoFiliacaoRequest,
  CreateSolicitacaoFiliacaoResponse,
  LookupOption,
  SolicitacaoFiliacaoBootstrapResponse,
  SolicitacaoFiliacaoVinculoLookupsResponse
} from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";

export interface CidadeOption extends LookupOption {
  uf: string;
}

export interface SolicitacaoFiliacaoLookupsResponse {
  ufs: LookupOption[];
  generos: LookupOption[];
  estadosCivis: LookupOption[];
  racas: LookupOption[];
  cidades: CidadeOption[];
  vinculos: SolicitacaoFiliacaoVinculoLookupsResponse;
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

const MOCK_UBS: SolicitacaoFiliacaoVinculoLookupsResponse = {
  empresas: [{ value: "0001", label: "0001 MUNICIPIO DE ARACAJU" }],
  situacoesFuncionais: [{ value: "1", label: "ATIVO" }],
  niveisCarreira: [{ value: "1", label: "NÍVEL 1" }],
  cargos: [{ value: "1", label: "PROFESSOR" }],
  funcoesMagisterio: [{ value: "1", label: "FUNÇÃO MAGISTÉRIO" }],
  formacoesProfissionais: [{ value: "1", label: "SUPERIOR" }],
  regimesTrabalho: [{ value: "1", label: "ESTATUTÁRIO" }],
  especiesInss: [{ value: "1", label: "APOSENTADORIA" }]
};

class SolicitarFiliacaoService {
  async getBootstrap(cpf: string): Promise<SolicitacaoFiliacaoBootstrapResponse> {
    const cpfDigits = normalizeCpf(cpf);

    if (USE_MOCKS) {
      return {
        cpf: `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`,
        solicitacaoStatus: null,
        hasDraftInProgress: false,
        nome: "Filiado(a) TESTE",
        nomeSocial: "",
        pai: "",
        mae: "",
        naturalidade: "",
        cep: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "SE",
        telefone: "",
        celular: "",
        celularIi: "",
        dataNascimento: null,
        email: "usuario@sintese.org.br",
        estadoCivil: "",
        especificarGenero: "",
        orientacaoSexual: "",
        sexo: "",
        rg: "",
        dataExpRg: null,
        sangueTpRh: "",
        rgOrgao: "",
        rgUf: "SE",
        raca: "",
        matriculaOrgao: "",
        codigoEmpresa: "",
        codigoPredio: "",
        situacaoFuncional: "",
        nivelSalarialOrgao: "",
        cargoOrgao: "",
        profissaoOrgao: "",
        funcaoOrgao: "",
        vinculoOrgao: "",
        cargaHorariaOrgao: "",
        admissaoOrgao: null,
        aposentadoriaOrgao: null,
        descontarInss: "",
        dataDescontoInss: null,
        numeroBeneficioInss: "",
        codigoEspecieInss: "",
        adicionarOutraFiliacao: false,
        matriculaOrgaoI: "",
        codigoEmpresaI: "",
        codigoPredioI: "",
        situacaoOrgaoI: "",
        nivelSalarialOrgaoI: "",
        cargoOrgaoI: "",
        profissaoOrgaoI: "",
        funcaoOrgaoI: "",
        vinculoOrgaoI: "",
        cargaHorariaOrgaoI: "",
        admissaoOrgaoI: null,
        aposentadoriaOrgaoI: null,
        descontarInssI: "",
        dataDescontoInssI: null,
        numeroBeneficioInssI: "",
        codigoEspecieInssI: "",
        autorizarDesconto: true,
        autorizarLgpd: true,
        termoLgpdConfirmacao: "",
        termoAutorizacaoDesconto: "Texto de autorizacao de desconto sindical (mock).",
        termoLgpdTexto: "Texto do termo LGPD (mock).",
        termoLgpdDataExtenso: "Aracaju/SE, 18 de maio de 2026",
        fotoPerfilUrl: null,
        fotoResidenciaUrl: null,
        fotoContracheque01Url: null,
        fotoContracheque02Url: null,
        fotoDocumentoUrl: null,
        fotoRgFrenteUrl: null,
        fotoRgVersoUrl: null,
        fatoresSanguineos: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((item) => ({
          value: item,
          label: item
        }))
      };
    }

    const query = new URLSearchParams({ cpf: cpfDigits }).toString();
    return apiRequest<SolicitacaoFiliacaoBootstrapResponse>(`/users/solicitar-filiacao?${query}`);
  }

  async getLookups(uf: string): Promise<SolicitacaoFiliacaoLookupsResponse> {
    if (USE_MOCKS) {
      return {
        ufs: [{ value: "SE", label: "SE" }],
        generos: [
          { value: "M", label: "Masculino" },
          { value: "F", label: "Feminino" }
        ],
        estadosCivis: [{ value: "1", label: "SOLTEIRO(A)" }],
        racas: [{ value: "1", label: "BRANCA" }],
        cidades: [{ value: "Aracaju", label: "Aracaju", uf: "SE" }],
        vinculos: MOCK_UBS
      };
    }

    const cidadeQuery = new URLSearchParams({ uf: uf.trim().toUpperCase() }).toString();
    const [ufs, generos, estadosCivis, racas, cidades, vinculos] = await Promise.all([
      apiRequest<LookupOption[]>("/users/lookups/ufs"),
      apiRequest<LookupOption[]>("/users/lookups/generos"),
      apiRequest<LookupOption[]>("/users/lookups/estados-civis"),
      apiRequest<LookupOption[]>("/users/lookups/racas"),
      apiRequest<CidadeOption[]>(`/users/lookups/cidades?${cidadeQuery}`),
      apiRequest<SolicitacaoFiliacaoVinculoLookupsResponse>("/users/lookups/filiacao-vinculos")
    ]);

    return { ufs, generos, estadosCivis, racas, cidades, vinculos };
  }

  async create(payload: CreateSolicitacaoFiliacaoRequest): Promise<CreateSolicitacaoFiliacaoResponse> {
    if (USE_MOCKS) {
      return {
        success: true,
        protocolo: crypto.randomUUID().toUpperCase(),
        message: "Solicitação de filiação enviada com sucesso."
      };
    }

    return apiRequest<CreateSolicitacaoFiliacaoResponse>("/users/solicitar-filiacao", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}

export const solicitarFiliacaoService = new SolicitarFiliacaoService();
