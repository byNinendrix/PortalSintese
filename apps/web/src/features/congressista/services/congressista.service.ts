import { apiRequest } from "../../../shared/services/apiClient";

export interface CongressoAtivo {
  id_congresso: number | null;
  ano: number | string | null;
  discriminacao: string | null;
  tema_geral: string | null;
  local: string | null;
  local_pre: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  logo: string | null;
}

export interface CongressistaBasico {
  id_congressista: number | null;
  id_congresso: number | null;
  id_filiado: number | null;
  nome?: string | null;
  sexo?: string | null;
  grupo_estudo?: {
    id_cong_grupo?: number | null;
    id_grupo?: number | null;
    descricao?: string | null;
  } | null;
  hospedagem?: {
    id_cong_hotel_capa?: number | null;
    descricao?: string | null;
  } | null;
  credenciado: boolean;
  desistiu: boolean;
  creche: boolean;
  transporte: boolean;
  funcao: string | null;
  delegacao: string | null;
  plenaria: string | null;
  dependentes?: Array<{
    id_congressista_dep: number | null;
    nome?: string | null;
    genero?: string | null;
    idade?: number | null;
    faixa?: string | null;
    nascimento_extenso?: string | null;
    hospedagem?: {
      id_cong_hotel_capa?: number | null;
      descricao?: string | null;
    } | null;
    possui_deficiencia?: boolean;
    descricao_deficiencia?: string | null;
    problema_saude?: boolean;
    descricao_saude?: string | null;
    restricao_alimentar?: boolean;
    descricao_alimentar?: string | null;
    alergia?: boolean;
    descricao_alergia?: string | null;
    utiliza_medicamento?: boolean;
    descricao_medicamento?: string | null;
    observacao?: string | null;
  }>;
}

export interface ConsultaCongressistaAtivo {
  encontrado: boolean;
  mensagem: string;
  congressista?: CongressistaBasico;
}

export interface CongressistaService {
  getCongressoAtivo(): Promise<CongressoAtivo | null>;
  consultarCongressistaAtivo(cpf: string): Promise<ConsultaCongressistaAtivo>;
}

class CongressistaServiceImpl implements CongressistaService {
  async getCongressoAtivo(): Promise<CongressoAtivo | null> {
    return apiRequest<CongressoAtivo | null>("/congressos/ativo");
  }

  async consultarCongressistaAtivo(cpf: string): Promise<ConsultaCongressistaAtivo> {
    const searchParams = new URLSearchParams({ cpf });
    return apiRequest<ConsultaCongressistaAtivo>(`/congressos/ativo/congressista?${searchParams.toString()}`);
  }
}

export const congressistaService: CongressistaService = new CongressistaServiceImpl();
