import { Injectable } from "@nestjs/common";
import { LegacyDatabaseService } from "../../../infra/legacy-database/legacy-database.service";

interface RamoAtividadeRow {
  DESCRICAO: string;
}

interface ConvenioRow {
  CNPJ: string | null;
  IMAGEM: string | Buffer | null;
  FANTASIA: string | null;
  ENDERECO: string | null;
  BAIRRO: string | null;
  NUMERO: string | null;
  CIDADE: string | null;
  UF: string | null;
  CEP: string | null;
  CELULAR: string | null;
  DESCONTO: string | null;
  TELEFONE01: string | null;
  TELEFONE02: string | null;
  CEP_NORMAL: string | null;
}

@Injectable()
export class ConveniosService {
  constructor(private readonly legacyDatabaseService: LegacyDatabaseService) {}

  private toText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private toImage(value: unknown): string | null {
    if (Buffer.isBuffer(value)) {
      return `data:image/jpeg;base64,${value.toString("base64")}`;
    }

    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    if (
      normalized.startsWith("data:image/") ||
      normalized.startsWith("http://") ||
      normalized.startsWith("https://") ||
      normalized.startsWith("/")
    ) {
      return normalized;
    }

    return `data:image/jpeg;base64,${normalized}`;
  }

  async findAll(filters: { ramo?: string; parceiro?: string }) {
    const ramo = this.toText(filters.ramo);

    if (!ramo) {
      return [];
    }

    const rows = await this.legacyDatabaseService.query<ConvenioRow>(
      `
      Select
        DBO.formatar_cpfcnpj(CONVENIADOS.CNPJ) As CNPJ,
        CONVENIADOS.LOGO As IMAGEM,
        CONVENIADOS.FANTASIA,
        CONVENIADOS.ENDERECO,
        CONVENIADOS.BAIRRO,
        CONVENIADOS.NUMERO,
        CONVENIADOS.CIDADE,
        CONVENIADOS.UF,
        dbo.formatar_cep(CONVENIADOS.CEP) As CEP,
        dbo.formatar_telefone(CONVENIADOS.CELULAR) As CELULAR,
        CONVENIADOS.DESCONTO,
        dbo.formatar_telefone(CONVENIADOS.TELEFONE01) As TELEFONE01,
        dbo.formatar_telefone(CONVENIADOS.TELEFONE02) As TELEFONE02,
        CONVENIADOS.CEP As CEP_NORMAL
      From
        CONVENIADOS
        Inner Join
        CONVENIADOS_RAMO_ATIVIDADE
          On CONVENIADOS.CNPJ = CONVENIADOS_RAMO_ATIVIDADE.CNPJ
      Where
        (CONVENIADOS_RAMO_ATIVIDADE.DESCRICAO = @RAMO) And
        (CONVENIADOS.SITUACAO = 'A')
      Order By
        CONVENIADOS.FANTASIA
      `,
      { RAMO: ramo }
    );

    return rows.map((row) => ({
      cnpj: this.toText(row.CNPJ),
      image: this.toImage(row.IMAGEM),
      fantasia: this.toText(row.FANTASIA),
      endereco: this.toText(row.ENDERECO),
      bairro: this.toText(row.BAIRRO),
      numero: this.toText(row.NUMERO),
      cidade: this.toText(row.CIDADE),
      uf: this.toText(row.UF),
      cep: this.toText(row.CEP),
      celular: this.toText(row.CELULAR),
      desconto: this.toText(row.DESCONTO),
      telefone01: this.toText(row.TELEFONE01),
      telefone02: this.toText(row.TELEFONE02),
      cepNormal: this.toText(row.CEP_NORMAL)
    }));
  }

  async listRamosAtividade() {
    const rows = await this.legacyDatabaseService.query<RamoAtividadeRow>(`
      Select
        CONVENIADOS_RAMO_ATIVIDADE.DESCRICAO
      From
        CONVENIADOS_RAMO_ATIVIDADE
        Inner Join
        CNAES On CONVENIADOS_RAMO_ATIVIDADE.DESCRICAO = CNAES.DENOMINACAO
      Group By
        CONVENIADOS_RAMO_ATIVIDADE.DESCRICAO
      Order By
        CONVENIADOS_RAMO_ATIVIDADE.DESCRICAO
    `);

    return rows.map((row) => row.DESCRICAO).filter((value) => typeof value === "string");
  }
}
