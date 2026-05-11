import type { AtualizarDadosPessoaResponse, LookupOption, UpdateUserDataRequest, UpdateUserDataResponse } from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";

export interface CidadeOption extends LookupOption {
  uf: string;
}

export interface AtualizarDadosLookups {
  fatoresSanguineos: LookupOption[];
  ufs: LookupOption[];
  generos: LookupOption[];
  estadosCivis: LookupOption[];
  racas: LookupOption[];
  cidades: CidadeOption[];
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

const DEFAULT_FATORES_SANGUINEOS: LookupOption[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
  (value) => ({ value, label: value })
);

const DEFAULT_UFS: LookupOption[] = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO"
].map((uf) => ({ value: uf, label: uf }));

const DEFAULT_GENEROS: LookupOption[] = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" }
];

const DEFAULT_ESTADOS_CIVIS: LookupOption[] = [
  { value: "1", label: "Solteiro(a)" },
  { value: "2", label: "Casado(a)" },
  { value: "3", label: "Divorciado(a)" },
  { value: "4", label: "Viúvo(a)" }
];

const DEFAULT_RACAS: LookupOption[] = [
  { value: "1", label: "Indígena" },
  { value: "2", label: "Branca" },
  { value: "3", label: "Preta" },
  { value: "4", label: "Amarela" },
  { value: "5", label: "Parda" }
];

class AtualizarMeusDadosService {
  private isNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    return error.message.includes("404");
  }

  private buildEmptyPessoa(cpfDigits: string): AtualizarDadosPessoaResponse {
    return {
      cpf: `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`,
      nome: "Filiado(a) SINTESE",
      fotoPerfilUrl: null,
      pai: "",
      mae: "",
      naturalidade: "",
      ufNaturalidade: "",
      nacionalidade: "",
      fatorHr: "",
      rg: "",
      rgOrgao: "",
      rgUf: "",
      dataExpRg: null,
      tituloEleitor: "",
      sexo: "",
      estadoCivil: "",
      telefone: "",
      celular: "",
      dataNascimento: null,
      grauInstrucao: "",
      cartProfissional: "",
      email: "",
      raca: "",
      sangueTpRh: "",
      celularIi: "",
      enderecoAcr: "",
      complementoAcr: "",
      bairroAcr: "",
      cidadeAcr: "",
      estadoAcr: "",
      cepAcr: "",
      numeroAcr: "",
      idPessoa: "",
      nomeSocial: "",
      especificarGenero: "",
      orientacaoSexual: ""
    };
  }

  private mergeProfileFallback(
    cpfDigits: string,
    profile: {
      cpf: string;
      nome: string;
    }
  ): AtualizarDadosPessoaResponse {
    return {
      ...this.buildEmptyPessoa(cpfDigits),
      cpf: profile.cpf,
      nome: profile.nome
    };
  }

  private async fetchLookupWithFallback<T>(path: string, fallbackValue: T): Promise<T> {
    try {
      return await apiRequest<T>(path);
    } catch {
      return fallbackValue;
    }
  }

  async getDadosPessoa(cpf: string): Promise<AtualizarDadosPessoaResponse> {
    const cpfDigits = normalizeCpf(cpf);

    if (USE_MOCKS) {
      return this.buildEmptyPessoa(cpfDigits);
    }

    const query = new URLSearchParams({ cpf: cpfDigits }).toString();

    try {
      return await apiRequest<AtualizarDadosPessoaResponse>(`/users/atualizar-dados?${query}`);
    } catch (error) {
      if (!this.isNotFoundError(error)) {
        throw error;
      }
    }

    try {
      const profile = await apiRequest<{ cpf: string; nome: string }>(`/users/profile?${query}`);
      return this.mergeProfileFallback(cpfDigits, profile);
    } catch (error) {
      if (!this.isNotFoundError(error)) {
        throw error;
      }
    }

    const lgpdProfile = await apiRequest<{ cpf: string; nome: string }>(`/lgpd/termo?${query}`);
    return this.mergeProfileFallback(cpfDigits, lgpdProfile);
  }

  async getLookups(ufCidade: string): Promise<AtualizarDadosLookups> {
    if (USE_MOCKS) {
      return {
        fatoresSanguineos: DEFAULT_FATORES_SANGUINEOS,
        ufs: [{ value: "SE", label: "SE" }],
        generos: DEFAULT_GENEROS,
        estadosCivis: DEFAULT_ESTADOS_CIVIS,
        racas: DEFAULT_RACAS,
        cidades: [{ value: "Aracaju", label: "Aracaju", uf: "SE" }]
      };
    }

    const cidadeQuery = new URLSearchParams({ uf: ufCidade }).toString();
    const [fatoresSanguineos, ufs, generos, estadosCivis, racas, cidades] = await Promise.all([
      this.fetchLookupWithFallback<LookupOption[]>("/users/lookups/fatores-sanguineos", DEFAULT_FATORES_SANGUINEOS),
      this.fetchLookupWithFallback<LookupOption[]>("/users/lookups/ufs", DEFAULT_UFS),
      this.fetchLookupWithFallback<LookupOption[]>("/users/lookups/generos", DEFAULT_GENEROS),
      this.fetchLookupWithFallback<LookupOption[]>("/users/lookups/estados-civis", DEFAULT_ESTADOS_CIVIS),
      this.fetchLookupWithFallback<LookupOption[]>("/users/lookups/racas", DEFAULT_RACAS),
      this.fetchLookupWithFallback<CidadeOption[]>(`/users/lookups/cidades?${cidadeQuery}`, [])
    ]);

    return {
      fatoresSanguineos,
      ufs,
      generos,
      estadosCivis,
      racas,
      cidades
    };
  }

  async updateDados(payload: UpdateUserDataRequest): Promise<UpdateUserDataResponse> {
    return apiRequest<UpdateUserDataResponse>("/users/atualizar-dados", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}

export const atualizarMeusDadosService = new AtualizarMeusDadosService();


