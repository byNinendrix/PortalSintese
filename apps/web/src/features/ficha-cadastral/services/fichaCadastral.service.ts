import type { FichaCadastralResponse } from "@sintese/types";
import { USE_MOCKS } from "../../../config/featureFlags";
import { apiRequest } from "../../../shared/services/apiClient";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

class FichaCadastralService {
  async getFichaCadastral(cpf: string, usuario?: string): Promise<FichaCadastralResponse> {
    const cpfDigits = normalizeCpf(cpf);
    const usuarioParam = (usuario ?? cpfDigits).trim() || cpfDigits;

    if (USE_MOCKS) {
      return {
        cpf: cpfDigits,
        usuario: usuarioParam,
        generatedAt: new Date().toISOString(),
        pessoa: {
          cpfOculto: "***.619.464-**",
          nome: "Filiado(a) SINTESE",
          pai: "PAI",
          mae: "MAE",
          naturalidade: "ARACAJU",
          nacionalidade: "BRASILEIRO(A)",
          rgOculto: "123*****",
          dataExpRg: "2025-01-01T00:00:00.000Z",
          tituloEleitor: "*******",
          sexo: "M",
          endereco: "RUA TESTE",
          bairro: "CENTRO",
          cidade: "ARACAJU",
          estado: "SE",
          cep: "49000000",
          telefone: "(79) 9999-9999",
          celular: "(79) 9999-9999",
          dataNascimento: "1990-01-01T00:00:00.000Z",
          dataEmisCarteira: "2025-01-01T00:00:00.000Z",
          dataValCarteira: "2027-01-01T00:00:00.000Z",
          autorizaEmail: "Sim",
          email: "filiado@sintese.org.br",
          dataInclusao: "2024-01-01T00:00:00.000Z",
          nascimentoExtenso: "36 anos",
          estadoCivilDescricao: "SOLTEIRO(A)",
          instrucao: "SUPERIOR",
          complemento: "CASA",
          racaDescricao: "BRANCA",
          numero: "10",
          qrCodeFicha: null,
          fotoImg: null
        },
        filiacoes: [
          {
            situacao: "ATIVO",
            matricula: "3291",
            descEmpresa: "0001 - MUNICIPIO EXEMPLO",
            descPredio: "0003 - ESCOLA EXEMPLO",
            filiado: "Sim",
            dataSindicalizacao: "2026-01-16T10:29:00.000Z",
            dataDesfiliacao: null
          }
        ],
        dependentes: [
          {
            nome: "DEPENDENTE 1",
            sexo: "M",
            dataNascimento: "2012-01-01T00:00:00.000Z",
            parentesco: "FILHO(A)",
            cpfDependente: "***.***.***-**"
          }
        ],
        sindicato: {
          cnpj: "00.000.000/0001-00",
          razaoSocial: "SINDICATO DOS TRABALHADORES EM EDUCACAO BASICA DA REDE OFICIAL DO ESTADO DE SERGIPE",
          fantasia: "SINTESE",
          logoImg: null
        }
      };
    }

    const query = new URLSearchParams({
      cpf: cpfDigits,
      usuario: usuarioParam
    }).toString();

    return apiRequest<FichaCadastralResponse>(`/users/ficha-cadastral?${query}`);
  }
}

export const fichaCadastralService = new FichaCadastralService();

