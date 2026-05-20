import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { randomInt, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as nodemailer from "nodemailer";
import * as QRCode from "qrcode";
import { LegacyDatabaseService } from "../../../infra/legacy-database/legacy-database.service";
import { renderPortalEmailTemplate } from "../../../shared/email/portal-email.template";
import { CreateSolicitacaoFiliacaoDto } from "../dto/create-solicitacao-filiacao.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDataDto } from "../dto/update-user-data.dto";

interface PessoaLoginRow {
  CPF: string;
  EMAIL?: string | null;
  WHATSAPP?: string | null;
}

interface PessoaProfileRow {
  CPF: string;
  NOME?: string | null;
}

interface FiliacaoRow {
  CPF: string;
  situacao?: string | null;
  MATRICULA?: string | number | null;
  CODIGO_EMPRESA?: string | number | null;
  DESCRICAO_EMPRESA?: string | null;
  CODIGO_PREDIO?: string | number | null;
  DESCRICAO_PREDIO?: string | null;
  tempo_filiacao?: string | null;
  REGIAO?: string | null;
}

interface ProtocoloRow {
  PROTOCOLO?: string | null;
  CPF?: string | null;
  STATUS?: string | null;
  MATRICULA_01?: string | number | null;
  CODIGO_EMPRESA_01?: string | number | null;
  EMPRESA_01?: string | null;
  CODIGO_PREDIO_01?: string | number | null;
  MATRICULA_02?: string | number | null;
  CODIGO_EMPRESA_02?: string | number | null;
  EMPRESA_02?: string | null;
  CODIGO_PREDIO_02?: string | number | null;
  ADICIONAR_OUTRA_FILIACAO?: string | number | boolean | null;
  FOTO_CONTRACHEQUE01?: Buffer | string | null;
  FOTO_CONTRACHEQUE02?: Buffer | string | null;
}

interface RegenciaClasseRow {
  VALOR?: string | number | null;
  NOME?: string | null;
  CPF?: string | null;
  DATANASCIMENTO?: Date | string | null;
}

interface ProtocoloRelatorioRow {
  CPFAGGFILIACAO?: string | null;
  NOME?: string | null;
  PAI?: string | null;
  MAE?: string | null;
  NATURALIDADE?: string | null;
  CEP?: string | null;
  ENDERECO?: string | null;
  COMPLEMENTO?: string | null;
  BAIRRO?: string | null;
  CIDADE?: string | null;
  ESTADO?: string | null;
  TELEFONE?: string | null;
  CELULAR?: string | null;
  CELULARII?: string | null;
  DATANASCIMENTO?: Date | string | null;
  EMAILMAIUSCULO?: string | null;
  ESTADOCIVIL?: string | null;
  RGOCULTO?: string | null;
  DATA_REGISTRO?: Date | string | null;
  FOTO_RESIDENCIA?: Buffer | string | null;
  FOTO_CONTRACHEQUE01?: Buffer | string | null;
  FOTO_CONTRACHEQUE02?: Buffer | string | null;
  FOTO_RG_FRENTE?: Buffer | string | null;
  FOTO_RG_VERSO?: Buffer | string | null;
  PROTOCOLO?: string | null;
  IP?: string | null;
  DATAEXPRG?: Date | string | null;
  SANGUE_TP_RH?: string | null;
  RG_ORGAO?: string | null;
  RG_UF?: string | null;
  NRPROTOCOLO?: string | null;
  RACA?: string | null;
  MATRICULA_ORGAO?: string | number | null;
  CARGAHORARIA_ORGAO?: string | number | null;
  ADMISSAO_ORGAO?: Date | string | null;
  APOSENTADORIA_ORGAO?: Date | string | null;
  ADICIONAR_OUTRA_FILIACAO?: string | number | boolean | null;
  MATRICULA_ORGAOI?: string | number | null;
  ADMISSAO_ORGAOI?: Date | string | null;
  APOSENTADORIA_ORGAOI?: Date | string | null;
  SITUACAO_FILIACAO?: string | null;
  SITUACAO_ORGAO?: string | null;
  NIVEL_ORGAO?: string | null;
  NIVEL_ORGAO_I?: string | null;
  FUNCAO_ORGAO?: string | null;
  FUNCAO_ORGAO_I?: string | null;
  PROFISSAO_ORGAO?: string | null;
  PROFISSAO_ORGAO_I?: string | null;
  VINCULO_EMPREGATICIO_ORGAO?: string | null;
  VINCULO_EMPREGATICIO_ORGAO_I?: string | null;
  NUMERO?: string | number | null;
  FOTO?: Buffer | string | null;
  AUTORIZARDESCONTO?: string | null;
  TERMOLGPD?: string | null;
  ENTEPUBLICO?: string | null;
  ENTEPUBLICOI?: string | null;
  CODIGO_EMPRESA?: string | number | null;
  CODIGO_EMPRESAI?: string | number | null;
  CODIGO_PREDIO?: string | number | null;
  CODIGO_PREDIOI?: string | number | null;
  SITUACAO_FUNCIONAL?: string | null;
  TEXTO_LGPD?: string | null;
  DESCONTAR_INSSMAIUSCULO?: string | null;
  DATA_DESCONTO_INSS?: Date | string | null;
  NUMERO_BENEFICIO_INSS?: string | null;
  DESCONTAR_INSSIMAIUSCULO?: string | null;
  DATA_DESCONTO_INSSI?: Date | string | null;
  NUMERO_BENEFICIO_INSSI?: string | null;
  ESPECIE_INSS?: string | null;
  ESPECIE_INSS_I?: string | null;
  FOTO_DOCUMENTO?: Buffer | string | null;
  ESPECIFICAR_GENERO?: string | null;
  ORIENTACAO_SEXUAL?: string | null;
  NOME_SOCIAL?: string | null;
  SEXOMAIUSCULO?: string | null;
  CARGO?: string | null;
  CARGO1?: string | null;
}

interface ProtocoloRelatorioSindicatoRow {
  CNPJ?: string | null;
  RAZAO_SOCIAL?: string | null;
  FANTASIA?: string | null;
  LOGO?: Buffer | string | null;
  TEXTO_AUTORIZACAO_DESCONTO?: string | null;
}

interface FichaCadastralPessoaRow {
  CPFOCULTO?: string | null;
  NOME?: string | null;
  PAI?: string | null;
  MAE?: string | null;
  NATURALIDADE?: string | null;
  NACIONALIDADE?: string | null;
  RGOCULTO?: string | null;
  DATAEXPRG?: Date | string | null;
  TITULOELEITOR?: string | null;
  SEXO?: string | null;
  ENDERECO?: string | null;
  BAIRRO?: string | null;
  CIDADE?: string | null;
  ESTADO?: string | null;
  CEP?: string | null;
  TELEFONE?: string | null;
  CELULAR?: string | null;
  DATANASCIMENTO?: Date | string | null;
  DATAEMISCARTEIRA?: Date | string | null;
  DATAVALCARTEIRA?: Date | string | null;
  AUTORIZAEMAIL?: string | null;
  EMAIL?: string | null;
  DATAINCLUSAO?: Date | string | null;
  NASCIMENTO_EXTENSO?: string | null;
  DESCRICAO?: string | null;
  INSTRUCAO?: string | null;
  COMPLEMENTO?: string | null;
  DESCRACA?: string | null;
  NUMERO?: string | number | null;
  QRCODE_FICHA?: Buffer | string | null;
  FOTOIMG?: Buffer | string | null;
}

interface FichaCadastralFiliacaoRow {
  SITUACAO?: string | null;
  MATRICULA?: string | number | null;
  DESCEMPRESA?: string | null;
  DESCPREDIO?: string | null;
  FILIADO?: string | null;
  DATASINDICALIZACAO?: Date | string | null;
  DATADESFILIACAO?: Date | string | null;
}

interface FichaCadastralDependenteRow {
  NOME?: string | null;
  SEXO?: string | null;
  DATANASCIMENTO?: Date | string | null;
  DESCRICAO?: string | null;
  CPFDEPENDENTE?: string | null;
  CPF?: string | null;
}

interface FichaCadastralSindicatoRow {
  CNPJ?: string | null;
  RAZAO_SOCIAL?: string | null;
  FANTASIA?: string | null;
  LOGO?: Buffer | string | null;
  URL?: string | null;
}

interface PessoaChaveFichaRow {
  CPF?: string | null;
  CHAVE?: string | null;
}

interface SindicatoCarteiraRow {
  ANO_VALIDADE_CARTEIRA?: string | number | null;
  EMITE_CARTEIRA?: string | number | boolean | null;
  URL?: string | null;
  IMG_CART_F_M?: Buffer | string | null;
  IMG_CART_V_M?: Buffer | string | null;
}

interface PessoaCarteiraRow {
  CPF: string;
  NOME?: string | null;
  NOME_SOCIAL?: string | null;
  DATAVALCARTEIRA?: Date | string | null;
  DATAEMISCARTEIRA?: Date | string | null;
  SANGUE_TP_RH?: string | null;
  CPF_EXTENSO?: string | null;
  CIDADE_CARTEIRINHA?: string | null;
  FOTO_IMG?: Buffer | string | null;
  ID_PESSOA?: string | number | null;
  QRCODE_CARTEIRA?: Buffer | string | null;
}

interface SchemaColumnRow {
  COLUMN_NAME?: string | null;
}

interface AtualizarDadosPessoaRow {
  CPF: string;
  NOME?: string | null;
  FOTO_IMG?: Buffer | string | null;
  PAI?: string | null;
  MAE?: string | null;
  NATURALIDADE?: string | null;
  UFNATURALIDADE?: string | null;
  NACIONALIDADE?: string | null;
  FATOR_HR?: string | null;
  RG?: string | null;
  RG_ORGAO?: string | null;
  RG_UF?: string | null;
  DATAEXPRG?: Date | string | null;
  TITULOELEITOR?: string | null;
  SEXO?: string | null;
  ESTADOCIVIL?: string | null;
  TELEFONE?: string | null;
  CELULAR?: string | null;
  DATANASCIMENTO?: Date | string | null;
  GRAUINSTRUCAO?: string | null;
  CARTPROFISSIONAL?: string | null;
  EMAIL?: string | null;
  RACA?: string | null;
  SANGUE_TP_RH?: string | null;
  CELULARII?: string | null;
  ENDERECO_ACR?: string | null;
  COMPLEMENTO_ACR?: string | null;
  BAIRRO_ACR?: string | null;
  CIDADE_ACR?: string | null;
  ESTADO_ACR?: string | null;
  CEP_ACR?: string | null;
  NUMERO_ACR?: string | null;
  ID_PESSOA?: string | number | null;
  NOME_SOCIAL?: string | null;
  ESPECIFICAR_GENERO?: string | null;
  ORIENTACAO_SEXUAL?: string | null;
}

interface EstadoCivilFallbackRow {
  ESTADOCIVIL?: string | null;
}

interface LookupUfRow {
  estado?: string | null;
}

interface LookupGeneroRow {
  GENERO?: string | null;
  DESCRICAO?: string | null;
}

interface LookupEstadoCivilRow {
  CODIGO?: string | number | null;
  DESCRICAO?: string | null;
}

interface LookupRacaRow {
  CODIGO?: string | number | null;
  DESCRICAO?: string | null;
}

interface LookupCidadeRow {
  CIDADE?: string | null;
  UF?: string | null;
}

interface LookupCodigoDescricaoRow {
  CODIGO?: string | number | null;
  DESCRICAO?: string | null;
}

interface SolicitacaoFiliacaoPessoaRow {
  CPF: string;
  NOME?: string | null;
  NOME_SOCIAL?: string | null;
  PAI?: string | null;
  MAE?: string | null;
  NATURALIDADE?: string | null;
  CEP?: string | null;
  ENDERECO?: string | null;
  NUMERO?: string | null;
  COMPLEMENTO?: string | null;
  BAIRRO?: string | null;
  CIDADE?: string | null;
  ESTADO?: string | null;
  TELEFONE?: string | null;
  CELULAR?: string | null;
  CELULARII?: string | null;
  DATANASCIMENTO?: Date | string | null;
  ESTADOCIVIL?: string | null;
  ESPECIFICAR_GENERO?: string | null;
  ORIENTACAO_SEXUAL?: string | null;
  SEXO?: string | null;
  RG?: string | null;
  DATAEXPRG?: Date | string | null;
  SANGUE_TP_RH?: string | null;
  RG_ORGAO?: string | null;
  RG_UF?: string | null;
  RACA?: string | null;
  FOTO_IMG?: Buffer | string | null;
}

interface SolicitacaoFiliacaoLoginRow {
  EMAIL?: string | null;
}

interface SolicitacaoFiliacaoDraftRow {
  REGISTRO?: string | number | null;
  STATUS?: string | null;
  PROTOCOLO?: string | null;
  NOME?: string | null;
  NOME_SOCIAL?: string | null;
  PAI?: string | null;
  MAE?: string | null;
  NATURALIDADE?: string | null;
  CEP?: string | null;
  ENDERECO?: string | null;
  NUMERO?: string | null;
  COMPLEMENTO?: string | null;
  BAIRRO?: string | null;
  CIDADE?: string | null;
  ESTADO?: string | null;
  TELEFONE?: string | null;
  CELULAR?: string | null;
  CELULARII?: string | null;
  DATANASCIMENTO?: Date | string | null;
  EMAIL?: string | null;
  ESTADOCIVIL?: string | null;
  ESPECIFICAR_GENERO?: string | null;
  ORIENTACAO_SEXUAL?: string | null;
  SEXO?: string | null;
  RG?: string | null;
  DATAEXPRG?: Date | string | null;
  SANGUE_TP_RH?: string | null;
  RG_ORGAO?: string | null;
  RG_UF?: string | null;
  RACA?: string | null;
  MATRICULA_ORGAO?: string | null;
  CODIGO_EMPRESA?: string | null;
  CODIGO_PREDIO?: string | null;
  SITUACAO_FUNCIONAL?: string | null;
  NIVELSALARIAL_ORGAO?: string | null;
  CARGO_ORGAO?: string | null;
  PROFISSAO_ORGAO?: string | null;
  FUNCAO_ORGAO?: string | null;
  VINCULO_ORGAO?: string | null;
  CARGAHORARIA_ORGAO?: string | null;
  ADMISSAO_ORGAO?: Date | string | null;
  APOSENTADORIA_ORGAO?: Date | string | null;
  DESCONTAR_INSS?: string | number | null;
  DATA_DESCONTO_INSS?: Date | string | null;
  NUMERO_BENEFICIO_INSS?: string | null;
  CODIGO_ESPECIE_INSS?: string | null;
  ADICIONAR_OUTRA_FILIACAO?: string | number | boolean | null;
  MATRICULA_ORGAOI?: string | null;
  CODIGO_EMPRESAI?: string | null;
  CODIGO_PREDIOI?: string | null;
  SITUACAO_ORGAOI?: string | null;
  NIVELSALARIAL_ORGAOI?: string | null;
  CARGO_ORGAOI?: string | null;
  PROFISSAO_ORGAOI?: string | null;
  FUNCAO_ORGAOI?: string | null;
  VINCULO_ORGAOI?: string | null;
  CARGAHORARIA_ORGAOI?: string | null;
  ADMISSAO_ORGAOI?: Date | string | null;
  APOSENTADORIA_ORGAOI?: Date | string | null;
  DESCONTAR_INSSI?: string | number | null;
  DATA_DESCONTO_INSSI?: Date | string | null;
  NUMERO_BENEFICIO_INSSI?: string | null;
  CODIGO_ESPECIE_INSSI?: string | null;
  AUTORIZAR_DESCONTO?: string | number | boolean | null;
  AUTORIZAR_LGPD?: string | number | boolean | null;
  TERMO_LGPD?: string | null;
  FOTO?: Buffer | string | null;
  FOTO_RESIDENCIA?: Buffer | string | null;
  FOTO_CONTRACHEQUE01?: Buffer | string | null;
  FOTO_CONTRACHEQUE02?: Buffer | string | null;
  FOTO_DOCUMENTO?: Buffer | string | null;
  FOTO_RG_FRENTE?: Buffer | string | null;
  FOTO_RG_VERSO?: Buffer | string | null;
}

interface SolicitacaoFiliacaoTermosRow {
  TEXTO_AUTORIZACAO_DESCONTO?: string | null;
  TERMO_LGPD?: string | null;
  DATAEXTENSO?: string | null;
}

interface ProtocoloExistsRow {
  PROTOCOLO?: string | null;
}

interface PessoaUpdateSnapshotRow {
  CPF: string;
  ENDERECO_ACR?: string | null;
  COMPLEMENTO_ACR?: string | null;
  BAIRRO_ACR?: string | null;
  CIDADE_ACR?: string | null;
  ESTADO_ACR?: string | null;
  CEP_ACR?: string | null;
  NUMERO_ACR?: string | null;
  ENDERECO_ALTEROU?: string | number | boolean | null;
  SOLICITOU_ALT_ENDE?: string | number | boolean | null;
}

interface SindicatoMailSettingsRow {
  AUTENTICACAO: string | number | boolean | null;
  SMTP_SERVIDOR: string | null;
  SMTP_PORTA: string | number | null;
  EMAIL: string | null;
  NOME_EMAIL: string | null;
  USUARIO_EMAIL: string | null;
  SENHA_EMAIL: string | null;
}

interface WhatsappTokenSettingsRow {
  CNPJ?: string | null;
  ENDPOINT_API?: string | null;
  TOKEN_API?: string | null;
  ATIVO?: string | number | boolean | null;
  BOT?: string | null;
  DEPARTAMENTO?: string | null;
  PRINCIPAL?: string | number | boolean | null;
}

interface CarteiraLayoutPayload {
  layout?: unknown;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly legacyDatabaseService: LegacyDatabaseService) {}

  private getCarteiraLayoutFilePath(): string {
    const customPath = process.env.CARTEIRA_LAYOUT_FILE?.trim();
    if (customPath) {
      return customPath;
    }
    return path.resolve(process.cwd(), ".local-dev", "carteira-layout-v1.json");
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isValidCarteiraLayout(layout: unknown): boolean {
    if (!this.isPlainObject(layout)) {
      return false;
    }
    const front = layout.front;
    const back = layout.back;
    return this.isPlainObject(front) && this.isPlainObject(back);
  }

  async getCarteiraLayout(): Promise<{ layout: Record<string, unknown> | null }> {
    const filePath = this.getCarteiraLayoutFilePath();

    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!this.isValidCarteiraLayout(parsed)) {
        return { layout: null };
      }
      return { layout: parsed as Record<string, unknown> };
    } catch (error) {
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code ?? "")
          : "";

      if (errorCode === "ENOENT") {
        return { layout: null };
      }

      const detail = error instanceof Error ? error.message : "falha desconhecida";
      this.logger.error(`Falha ao carregar layout global da carteira: ${detail}`);
      throw new InternalServerErrorException("Nao foi possivel carregar o layout global da carteira.");
    }
  }

  async saveCarteiraLayout(payload: CarteiraLayoutPayload): Promise<{ success: true }> {
    const candidate = payload.layout;
    if (!this.isValidCarteiraLayout(candidate)) {
      throw new BadRequestException("Layout da carteira invalido.");
    }

    const filePath = this.getCarteiraLayoutFilePath();
    const folder = path.dirname(filePath);

    try {
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(candidate, null, 2), "utf8");
      return { success: true };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "falha desconhecida";
      this.logger.error(`Falha ao salvar layout global da carteira: ${detail}`);
      throw new InternalServerErrorException("Nao foi possivel salvar o layout global da carteira.");
    }
  }

  private sanitizeCpf(cpf: string): string {
    return cpf.replace(/\D/g, "");
  }

  private sanitizePhone(phone?: string): string | null {
    if (!phone) {
      return null;
    }
    const digits = phone.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
  }

  private maskCpf(cpfDigits: string): string {
    if (cpfDigits.length !== 11) {
      return cpfDigits;
    }
    return `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`;
  }

  private async resolveEstadoCivil(cpfDigits: string, estadoCivil?: string | null): Promise<string> {
    const direct = estadoCivil?.trim() ?? "";
    if (direct) {
      return direct;
    }

    const aggRows = await this.legacyDatabaseService.query<EstadoCivilFallbackRow>(
      `
      Select Top 1
        ESTADOCIVIL
      From
        AGG_FILIACAO
      Where
        CPF = @CPF
        And NullIf(LTrim(RTrim(IsNull(ESTADOCIVIL, ''))), '') Is Not Null
      Order By
        Case
          When LTrim(RTrim(IsNull(ESTADOCIVIL, ''))) = '0' Then 1
          Else 0
        End
      `,
      { CPF: cpfDigits }
    );

    const aggEstadoCivil = aggRows[0]?.ESTADOCIVIL?.trim() ?? "";
    if (aggEstadoCivil) {
      return aggEstadoCivil;
    }

    return "0";
  }

  private toDateIso(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }

  private toDateTimeIso(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    const raw = String(value).trim();
    if (!raw) {
      return null;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString();
  }

  private normalizeScalar(
    value: string | number | boolean | Date | Buffer | null | undefined
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
      const decoded = value.toString("utf8").trim();
      return decoded.length > 0 ? decoded : null;
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private toNullableNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private buildLegacyFichaValidationUrl(baseUrl: string, cpfDigits: string, chave: string): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
    const filter = `PESSOAS_CHAVE_FICHA.CPF=${cpfDigits};PESSOAS_CHAVE_FICHA.CHAVE=${chave}`;
    const query = new URLSearchParams({
      sys: "SIF",
      action: "openform",
      formID: "500000781",
      mode: "-1",
      goto: "-1",
      filter,
      scrolling: "yes"
    });

    return `${normalizedBase}/form.jsp?${query.toString()}`;
  }

  private buildLegacyCarteiraUrl(baseUrl: string, cpfDigits: string): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
    const filter = `CPF=${cpfDigits};`;
    const query = new URLSearchParams({
      sys: "SIF",
      action: "openform",
      formID: "500000742",
      mode: "-1",
      goto: "-1",
      filter,
      scrolling: "yes",
      popup: "true"
    });

    return `${normalizedBase}/form.jsp?${query.toString()}`;
  }

  private resolveAnoValidadeCarteira(value: string | number | null | undefined): number {
    const parsed = Number(value ?? 2);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 2;
    }
    return Math.floor(parsed);
  }

  private toDateStart(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private async resolveFirstExistingColumn(tableName: string, candidates: string[]): Promise<string | null> {
    const rows = await this.legacyDatabaseService.query<SchemaColumnRow>(
      `
      Select
        INFORMATION_SCHEMA.COLUMNS.COLUMN_NAME
      From
        INFORMATION_SCHEMA.COLUMNS
      Where
        INFORMATION_SCHEMA.COLUMNS.TABLE_NAME = @TABLE_NAME
      `,
      { TABLE_NAME: tableName }
    );

    const available = new Set(
      rows
        .map((row) => this.normalizeScalar(row.COLUMN_NAME)?.toUpperCase() ?? "")
        .filter((value) => value.length > 0)
    );

    for (const candidate of candidates) {
      if (available.has(candidate.toUpperCase())) {
        return candidate;
      }
    }

    return null;
  }

  private isQrCodeDataUrl(value?: string | null): boolean {
    return (value ?? "").trim().startsWith("data:image/");
  }

  private toQrCodeDataUrl(value: Buffer | string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (Buffer.isBuffer(value)) {
      return `data:image/png;base64,${value.toString("base64")}`;
    }

    const raw = String(value).trim();
    if (!raw) {
      return null;
    }

    if (raw.startsWith("data:image/")) {
      return raw;
    }

    if (/^[A-Za-z0-9+/=\r\n]+$/.test(raw) && raw.length > 80) {
      return `data:image/png;base64,${raw.replace(/\s/g, "")}`;
    }

    // Compatibilidade com colunas BIN/IMAGE devolvidas como string binária pelo driver.
    const fromBinary = Buffer.from(raw, "binary").toString("base64");
    return fromBinary ? `data:image/png;base64,${fromBinary}` : null;
  }

  private async ensureFichaQrCode(cpfDigits: string, currentQrCode?: Buffer | string | null): Promise<string | null> {
    const currentDataUrl = this.toQrCodeDataUrl(currentQrCode);
    if (currentDataUrl) {
      return currentDataUrl;
    }

    try {
      const chaveRows = await this.legacyDatabaseService.query<PessoaChaveFichaRow>(
        `
        Select Top 1
          PESSOAS_CHAVE_FICHA.CPF,
          PESSOAS_CHAVE_FICHA.CHAVE
        From
          PESSOAS_CHAVE_FICHA
        Where
          PESSOAS_CHAVE_FICHA.CPF = @CPF
        `,
        { CPF: cpfDigits }
      );

      const chaveExistente = this.normalizeScalar(chaveRows[0]?.CHAVE);
      const possuiRegistroCpf = chaveRows.length > 0;

      const sindicatoRows = await this.legacyDatabaseService.query<FichaCadastralSindicatoRow>(
        `
        Select Top 1
          SINDICATO.URL
        From
          SINDICATO
        `
      );

      const sindicatoUrl = this.normalizeScalar(sindicatoRows[0]?.URL);
      if (!sindicatoUrl) {
        return null;
      }

      // Regra solicitada: só grava CHAVE em PESSOAS_CHAVE_FICHA quando estiver nula/vazia.
      let chave = chaveExistente;
      if (!chave) {
        chave = randomUUID().toUpperCase();

        if (possuiRegistroCpf) {
          await this.legacyDatabaseService.query(
            `
            Update PESSOAS_CHAVE_FICHA
            Set
              CHAVE = @CHAVE
            Where
              CPF = @CPF
            `,
            {
              CPF: cpfDigits,
              CHAVE: chave
            }
          );
        } else {
          await this.legacyDatabaseService.query(
            `
            Insert Into PESSOAS_CHAVE_FICHA
              (CPF, CHAVE)
            Values
              (@CPF, @CHAVE)
            `,
            {
              CPF: cpfDigits,
              CHAVE: chave
            }
          );
        }
      }

      const validationUrl = this.buildLegacyFichaValidationUrl(sindicatoUrl, cpfDigits, chave);
      const qrCodeDataUrl = await QRCode.toDataURL(validationUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 220
      });

      await this.legacyDatabaseService.query(
        `
        Update PESSOAS
        Set
          QRCODE_FICHA = @QRCODE_FICHA
        Where
          CPF = @CPF
        `,
        {
          CPF: cpfDigits,
          QRCODE_FICHA: qrCodeDataUrl
        }
      );

      return qrCodeDataUrl;
    } catch (error) {
      this.logger.warn(
        `Falha ao gerar QRCODE_FICHA para CPF ${cpfDigits}. Mantendo valor atual.`,
        error instanceof Error ? error.stack : undefined
      );
      return this.toQrCodeDataUrl(currentQrCode);
    }
  }

  private toFotoDataUrl(value: Buffer | string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      if (trimmed.startsWith("data:image/")) {
        return trimmed;
      }
      return `data:image/jpeg;base64,${trimmed}`;
    }

    const buffer = value;
    if (buffer.length === 0) {
      return null;
    }

    let mimeType = "image/jpeg";
    if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      mimeType = "image/png";
    } else if (buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      mimeType = "image/gif";
    } else if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      mimeType = "image/jpeg";
    }

    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }

  private normalizeOptionalText(value?: string): string | null {
    const trimmed = (value ?? "").trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeCep(value?: string): string | null {
    const digits = (value ?? "").replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
  }

  private toDateValue(value?: string): Date | null {
    const trimmed = (value ?? "").trim();
    if (!trimmed) {
      return null;
    }

    const parsed = new Date(`${trimmed}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Data inválida informada na atualização.");
    }

    return parsed;
  }

  private parseFotoFromDataUrl(value: string): Buffer {
    const trimmed = value.trim();
    const base64 = trimmed.startsWith("data:")
      ? trimmed.slice(trimmed.indexOf(",") + 1)
      : trimmed;

    if (!base64) {
      throw new BadRequestException("Imagem de perfil inválida.");
    }

    try {
      return Buffer.from(base64, "base64");
    } catch {
      throw new BadRequestException("Imagem de perfil inválida.");
    }
  }

  private isAutenticacaoEnabled(value: SindicatoMailSettingsRow["AUTENTICACAO"]): boolean {
    if (typeof value === "boolean") {
      return value;
    }
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized === "1" || normalized === "s" || normalized === "sim" || normalized === "true";
  }

  private isFlagEnabled(value: string | number | boolean | null | undefined): boolean {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value === 1;
    }
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized === "1" || normalized === "s" || normalized === "sim" || normalized === "true";
  }

  private boolToLegacy(value?: boolean): number {
    return value ? 1 : 0;
  }

  private toInssOption(value: string | number | boolean | null | undefined): "S" | "N" | "" {
    const normalized = this.normalizeScalar(value)?.toUpperCase() ?? "";
    if (!normalized) {
      return "";
    }

    if (normalized === "S" || normalized === "1" || normalized === "SIM" || normalized === "TRUE") {
      return "S";
    }

    if (normalized === "N" || normalized === "0" || normalized === "NAO" || normalized === "NÃO" || normalized === "FALSE") {
      return "N";
    }

    return "";
  }

  private normalizeIpAddress(ipValue?: string | null): string | null {
    const raw = (ipValue ?? "").trim();
    if (!raw) {
      return null;
    }

    if (raw === "::1") {
      return "127.0.0.1";
    }

    if (raw.startsWith("::ffff:")) {
      return raw.slice("::ffff:".length);
    }

    return raw;
  }

  private parseOptionalImage(value: string | undefined, fieldLabel: string): Buffer | null {
    if (typeof value !== "string") {
      return null;
    }

    try {
      return this.parseFotoFromDataUrl(value);
    } catch {
      throw new BadRequestException(`Imagem inválida no campo ${fieldLabel}.`);
    }
  }

  private generateFirstPassword(): string {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const special = "!@#$%*";
    const all = `${upper}${lower}${numbers}${special}`;

    const pick = (charset: string) => charset[randomInt(0, charset.length)];
    const chars = [pick(upper), pick(lower), pick(numbers), pick(special), pick(all), pick(all)];

    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = randomInt(0, i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
  }

  private maskCpfForEmail(cpfDigits: string): string {
    if (cpfDigits.length !== 11) {
      return cpfDigits;
    }
    return `***.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-**`;
  }

  private async getSindicatoMailSettings(): Promise<SindicatoMailSettingsRow> {
    const rows = await this.legacyDatabaseService.query<SindicatoMailSettingsRow>(`
      Select Top 1
        AUTENTICACAO,
        SMTP_SERVIDOR,
        SMTP_PORTA,
        EMAIL,
        NOME_EMAIL,
        USUARIO_EMAIL,
        SENHA_EMAIL
      From
        SINDICATO
    `);

    if (rows.length === 0) {
      throw new InternalServerErrorException("Configuração de e-mail não encontrada na tabela SINDICATO.");
    }

    return rows[0];
  }

  private async sendFirstPasswordEmail(payload: { to: string; cpf: string; password: string }) {
    const settings = await this.getSindicatoMailSettings();

    if (!settings.SMTP_SERVIDOR || !settings.SMTP_PORTA || !settings.EMAIL) {
      throw new InternalServerErrorException("Configuração SMTP incompleta na tabela SINDICATO.");
    }

    const port = Number(settings.SMTP_PORTA);
    const useAuth = this.isAutenticacaoEnabled(settings.AUTENTICACAO);
    const secure = port === 465;
    const fromName = settings.NOME_EMAIL?.trim() || "Sintese";
    const fromEmail = settings.EMAIL.trim();
    const maskedCpf = this.maskCpfForEmail(payload.cpf);

    const transporter = nodemailer.createTransport({
      host: settings.SMTP_SERVIDOR.trim(),
      port,
      secure,
      auth: useAuth
        ? {
            user: settings.USUARIO_EMAIL?.trim() || fromEmail,
            pass: settings.SENHA_EMAIL?.trim() || ""
          }
        : undefined,
      tls: {
        rejectUnauthorized: false
      }
    });

    const text = `Olá! Cadastro realizado com sucesso.
CPF: ${maskedCpf}
Sua primeira senha de acesso ao Portal do Filiado é: ${payload.password}
Por segurança, altere essa senha no primeiro acesso.`;

    const html = renderPortalEmailTemplate({
      title: "Cadastro confirmado",
      subtitle: "Primeiro acesso ao portal",
      tone: "success",
      identificationLabel: "Identificação",
      identificationValue: `CPF: ${maskedCpf}`,
      contentHtml: `
        <p style="margin:0 0 12px 0;">Olá! Cadastro realizado com sucesso.</p>
        <p style="margin:0 0 12px 0;">
          Sua primeira senha de acesso ao <strong>Portal do Filiado</strong> é:
          <span style="display:inline-block;background:#111827;color:#ffffff;padding:5px 12px;border-radius:8px;font-weight:700;letter-spacing:0.04em;">
            ${payload.password}
          </span>
        </p>
        <p style="margin:0;">Por segurança, altere essa senha no primeiro acesso.</p>
      `,
      footerText: "Portal do Filiad@ | SINTESE"
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: payload.to,
      subject: "Bem-vindo ao Portal do Filiad@ | Sua primeira senha de acesso",
      text,
      html
    });
  }

  private maskCpfForWhatsapp(cpfDigits: string): string {
    if (cpfDigits.length !== 11) {
      return cpfDigits;
    }
    return `XXX.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-XX`;
  }

  private normalizeWhatsappNumberForApi(phoneDigits: string): string {
    const digits = phoneDigits.replace(/\D/g, "");
    if (digits.startsWith("55")) {
      return digits;
    }
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    return digits;
  }

  private resolveWhatsappEndpointHost(endpoint: string): string {
    try {
      const parsed = new URL(endpoint);
      return parsed.host;
    } catch {
      return endpoint;
    }
  }

  private logWhatsappFirstPasswordAudit(payload: {
    cpf: string;
    number: string;
    endpoint: string;
    event: "attempt" | "success" | "error";
    detail?: string;
  }): void {
    const maskedCpf = this.maskCpfForWhatsapp(payload.cpf);
    const maskedNumber =
      payload.number.length >= 4 ? `***${payload.number.slice(-4)}` : "***";
    const endpointHost = this.resolveWhatsappEndpointHost(payload.endpoint);
    const baseMessage = `[AUDIT][WHATSAPP_FIRST_PASSWORD] event=${payload.event} cpf=${maskedCpf} number=${maskedNumber} endpoint=${endpointHost}`;

    if (payload.event === "error") {
      this.logger.error(`${baseMessage}${payload.detail ? ` detail=${payload.detail}` : ""}`);
      return;
    }

    this.logger.log(`${baseMessage}${payload.detail ? ` detail=${payload.detail}` : ""}`);
  }

  private async getWhatsappBotSettings(): Promise<WhatsappTokenSettingsRow> {
    const rows = await this.legacyDatabaseService.query<WhatsappTokenSettingsRow>(
      `
      Select
        SINDICATO.CNPJ,
        TOKENS_WHATSAPP.ENDPOINT_API,
        TOKENS_WHATSAPP.TOKEN_API,
        TOKENS_WHATSAPP.ATIVO,
        TOKENS_WHATSAPP.BOT,
        TOKENS_WHATSAPP.DEPARTAMENTO,
        TOKENS_WHATSAPP.PRINCIPAL
      From
        SINDICATO
        Left Join
        TOKENS_WHATSAPP On SINDICATO.CNPJ = TOKENS_WHATSAPP.CNPJ_SINDICATO
      Where
        TOKENS_WHATSAPP.DEPARTAMENTO = 'BOT MENSAGENS'
      `
    );

    const activeRows = rows.filter((row) => this.isFlagEnabled(row.ATIVO));
    const source = activeRows.length > 0 ? activeRows : rows;
    const ordered = [...source].sort((a, b) => {
      const aPrincipal = this.isFlagEnabled(a.PRINCIPAL) ? 1 : 0;
      const bPrincipal = this.isFlagEnabled(b.PRINCIPAL) ? 1 : 0;
      return bPrincipal - aPrincipal;
    });

    const settings = ordered[0];
    const endpoint = settings?.ENDPOINT_API?.trim() ?? "";
    const token = settings?.TOKEN_API?.trim() ?? "";

    if (!settings || !endpoint || !token) {
      throw new InternalServerErrorException("Configuracao do WhatsApp nao encontrada.");
    }

    return settings;
  }

  private async sendFirstPasswordWhatsapp(payload: {
    cpf: string;
    whatsapp: string;
    password: string;
  }): Promise<void> {
    const settings = await this.getWhatsappBotSettings();
    const endpoint = settings.ENDPOINT_API?.trim() || "https://api.conversafacil.com/api/messages/send";
    const token = settings.TOKEN_API?.trim() ?? "";
    const number = this.normalizeWhatsappNumberForApi(payload.whatsapp);

    if (!number) {
      throw new BadRequestException("Numero de WhatsApp invalido para envio da senha.");
    }

    const body = [
      `Sr(a).: ${this.maskCpfForWhatsapp(payload.cpf)}`,
      `Sua primeira senha de acesso ao Portal do Filiado do SINTESE e: ${payload.password}`,
      "Por favor, altere a senha assim que possivel para garantir a seguranca do seu acesso."
    ].join("\n");

    this.logWhatsappFirstPasswordAudit({
      cpf: payload.cpf,
      number,
      endpoint,
      event: "attempt"
    });

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          number,
          body
        })
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "falha desconhecida";
      this.logWhatsappFirstPasswordAudit({
        cpf: payload.cpf,
        number,
        endpoint,
        event: "error",
        detail
      });
      throw new InternalServerErrorException("Nao foi possivel enviar a primeira senha via WhatsApp.");
    }

    if (!response.ok) {
      this.logWhatsappFirstPasswordAudit({
        cpf: payload.cpf,
        number,
        endpoint,
        event: "error",
        detail: `status=${response.status}`
      });
      throw new InternalServerErrorException("Nao foi possivel enviar a primeira senha via WhatsApp.");
    }

    this.logWhatsappFirstPasswordAudit({
      cpf: payload.cpf,
      number,
      endpoint,
      event: "success",
      detail: `status=${response.status}`
    });
  }

  async checkCpfExists(cpf?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    if (cpfDigits.length !== 11) {
      return { exists: false, email: null, whatsapp: null };
    }

    const rows = await this.legacyDatabaseService.query<PessoaLoginRow>(
      `
      Select Top 1
        CPF,
        EMAIL,
        WHATSAPP
      From
        PESSOAS_LOGIN
      Where
        CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (rows.length === 0) {
      return { exists: false, email: null, whatsapp: null };
    }

    return {
      exists: true,
      email: rows[0].EMAIL?.trim() ?? null,
      whatsapp: rows[0].WHATSAPP?.trim() ?? null
    };
  }

  async getProfileByCpf(cpf?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const rows = await this.legacyDatabaseService.query<PessoaProfileRow>(
      `
      Select Top 1
        CPF,
        NOME
      From
        PESSOAS
      Where
        CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (rows.length === 0) {
      throw new BadRequestException("Pessoa não encontrada para o CPF informado.");
    }

    return {
      cpf: this.maskCpf(cpfDigits),
      nome: rows[0].NOME?.trim() ?? ""
    };
  }

  async getFiliacoesByCpf(cpf?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const rows = await this.legacyDatabaseService.query<FiliacaoRow>(
      `
      With PESSOA_BASE As (
        Select Top 1
          CPF,
          ESTADO,
          CIDADE
        From
          PESSOAS
        Where
          CPF = @CPF
      )
      Select
        FILIADO.CPF,
        SITUACAO_FILIADO.DESCRICAO As situacao,
        FILIADO.MATRICULA,
        FILIADO.CODIGO_EMPRESA As CODIGO_EMPRESA,
        EMPRESA.DESCRICAO As DESCRICAO_EMPRESA,
        FILIADO.CODIGO_PREDIO As CODIGO_PREDIO,
        PREDIO.DESCRICAO As DESCRICAO_PREDIO,
        Case
          When FILIADO.DATADESFILIACAO Is Null Then
            dbo.idadeextenso(FILIADO.DATASINDICALIZACAO, GetDate())
          Else dbo.idadeextenso(GetDate(), GetDate()) End As tempo_filiacao,
        Case
          When FILIADO.SITUACAO = '3' Then IsNull(REGIAO1.DESCRICAO, REGIAO.DESCRICAO)
          Else REGIAO.DESCRICAO End As REGIAO
      From
        FILIADO
        Left Join
        SITUACAO_FILIADO On FILIADO.SITUACAO = SITUACAO_FILIADO.CODIGO
        Left Join
        EMPRESA On FILIADO.CODIGO_EMPRESA = EMPRESA.CODIGO
        Left Join
        PREDIO On (FILIADO.CODIGO_EMPRESA = PREDIO.CODIGO_EMPRESA) And
          (FILIADO.CODIGO_PREDIO = PREDIO.CODIGO)
        Left Join
        REGIAO On FILIADO.REGIAO = REGIAO.CODIGO
        Left Join
        PESSOA_BASE On FILIADO.CPF = PESSOA_BASE.CPF
        Left Join
        GLO_CIDADE On (PESSOA_BASE.ESTADO = GLO_CIDADE.UF) And (PESSOA_BASE.CIDADE =
          GLO_CIDADE.CIDADE)
        Left Join
        REGIAO REGIAO1 On GLO_CIDADE.REGIAO = REGIAO1.CODIGO
      Where
        FILIADO.CPF = @CPF
      Order By
        FILIADO.CODIGO_EMPRESA,
        FILIADO.CODIGO_PREDIO,
        FILIADO.MATRICULA
      `,
      { CPF: cpfDigits }
    );

    return rows.map((row) => ({
      cpf: this.maskCpf(cpfDigits),
      situacao: row.situacao?.trim() ?? "",
      matricula: String(row.MATRICULA ?? "").trim(),
      codigoEmpresa: String(row.CODIGO_EMPRESA ?? "").trim(),
      descricaoEmpresa: row.DESCRICAO_EMPRESA?.trim() ?? "",
      codigoPredio: String(row.CODIGO_PREDIO ?? "").trim(),
      descricaoPredio: row.DESCRICAO_PREDIO?.trim() ?? "",
      regiao: row.REGIAO?.trim() ?? "",
      tempoFiliacao: row.tempo_filiacao?.trim() ?? ""
    }));
  }

  async getProtocolosByCpf(cpf?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const rows = await this.legacyDatabaseService.query<ProtocoloRow>(
      `
      Select
        AGG_FILIACAO.PROTOCOLO As PROTOCOLO,
        AGG_FILIACAO.CPF,
        dbo.StatusSolicitaFiliacao(AGG_FILIACAO.STATUS) As STATUS,
        AGG_FILIACAO.MATRICULA_ORGAO As MATRICULA_01,
        AGG_FILIACAO.CODIGO_EMPRESA As CODIGO_EMPRESA_01,
        EMPRESA.DESCRICAO As EMPRESA_01,
        AGG_FILIACAO.CODIGO_PREDIO As CODIGO_PREDIO_01,
        AGG_FILIACAO.MATRICULA_ORGAOI As MATRICULA_02,
        AGG_FILIACAO.CODIGO_EMPRESAI As CODIGO_EMPRESA_02,
        EMPRESA1.DESCRICAO As EMPRESA_02,
        AGG_FILIACAO.CODIGO_PREDIOI As CODIGO_PREDIO_02,
        AGG_FILIACAO.ADICIONAR_OUTRA_FILIACAO,
        AGG_FILIACAO.FOTO_CONTRACHEQUE01,
        AGG_FILIACAO.FOTO_CONTRACHEQUE02
      From
        AGG_FILIACAO
        Left Join EMPRESA On AGG_FILIACAO.CODIGO_EMPRESA = EMPRESA.CODIGO
        Left Join EMPRESA EMPRESA1 On AGG_FILIACAO.CODIGO_EMPRESAI = EMPRESA1.CODIGO
      Where
        AGG_FILIACAO.CPF = @CPF
        And AGG_FILIACAO.SITUACAO = '1'
      Order By
        AGG_FILIACAO.PROTOCOLO Desc
      `,
      { CPF: cpfDigits }
    );

    return rows.map((row) => ({
      protocolo: this.normalizeScalar(row.PROTOCOLO),
      cpf: this.maskCpf(cpfDigits),
      status: this.normalizeScalar(row.STATUS) ?? "Em análise",
      matricula01: this.normalizeScalar(row.MATRICULA_01),
      codigoEmpresa01: this.normalizeScalar(row.CODIGO_EMPRESA_01),
      empresa01: this.normalizeScalar(row.EMPRESA_01),
      codigoPredio01: this.normalizeScalar(row.CODIGO_PREDIO_01),
      matricula02: this.normalizeScalar(row.MATRICULA_02),
      codigoEmpresa02: this.normalizeScalar(row.CODIGO_EMPRESA_02),
      empresa02: this.normalizeScalar(row.EMPRESA_02),
      codigoPredio02: this.normalizeScalar(row.CODIGO_PREDIO_02),
      adicionarOutraFiliacao: this.isFlagEnabled(row.ADICIONAR_OUTRA_FILIACAO),
      fotoContracheque01: this.toFotoDataUrl(row.FOTO_CONTRACHEQUE01),
      fotoContracheque02: this.toFotoDataUrl(row.FOTO_CONTRACHEQUE02)
    }));
  }

  async getRegenciaClasseByCpf(cpf?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const rows = await this.legacyDatabaseService.query<RegenciaClasseRow>(
      `
      Select
        PESSOAS_PAGAMENTO.valor As VALOR,
        PESSOAS.NOME,
        PESSOAS.CPF,
        PESSOAS.DATANASCIMENTO
      From
        PESSOAS
        Inner Join PESSOAS_PAGAMENTO On PESSOAS.CPF = PESSOAS_PAGAMENTO.CPF
      Where
        PESSOAS.CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (rows.length === 0) {
      const profileRows = await this.legacyDatabaseService.query<PessoaProfileRow>(
        `
        Select Top 1
          CPF,
          NOME
        From
          PESSOAS
        Where
          CPF = @CPF
        `,
        { CPF: cpfDigits }
      );

      return {
        cpf: this.maskCpf(cpfDigits),
        nome: profileRows[0]?.NOME?.trim() ?? null,
        dataNascimento: null,
        valorTotal: null,
        hasData: false,
        registros: []
      };
    }

    const registros = rows.map((row) => ({
      valor: this.toNullableNumber(row.VALOR),
      nome: this.normalizeScalar(row.NOME),
      cpf: this.normalizeScalar(row.CPF),
      dataNascimento: this.toDateIso(row.DATANASCIMENTO)
    }));

    const valorTotal = registros.reduce<number | null>((acc, item) => {
      if (item.valor === null) {
        return acc;
      }
      if (acc === null) {
        return item.valor;
      }
      return acc + item.valor;
    }, null);

    return {
      cpf: this.maskCpf(cpfDigits),
      nome: registros[0]?.nome ?? null,
      dataNascimento: registros[0]?.dataNascimento ?? null,
      valorTotal,
      hasData: registros.length > 0,
      registros
    };
  }

  async getSolicitarFiliacaoByCpf(cpf?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const pessoaRows = await this.legacyDatabaseService.query<SolicitacaoFiliacaoPessoaRow>(
      `
      Select Top 1
        PESSOAS.CPF,
        PESSOAS.NOME,
        PESSOAS.NOME_SOCIAL,
        PESSOAS.PAI,
        PESSOAS.MAE,
        PESSOAS.NATURALIDADE,
        PESSOAS.CEP,
        PESSOAS.ENDERECO,
        PESSOAS.NUMERO,
        PESSOAS.COMPLEMENTO,
        PESSOAS.BAIRRO,
        PESSOAS.CIDADE,
        PESSOAS.ESTADO,
        PESSOAS.TELEFONE,
        PESSOAS.CELULAR,
        PESSOAS.CELULARII,
        PESSOAS.DATANASCIMENTO,
        PESSOAS.ESTADOCIVIL,
        PESSOAS.ESPECIFICAR_GENERO,
        PESSOAS.ORIENTACAO_SEXUAL,
        PESSOAS.SEXO,
        PESSOAS.RG,
        PESSOAS.DATAEXPRG,
        PESSOAS.SANGUE_TP_RH,
        PESSOAS.RG_ORGAO,
        PESSOAS.RG_UF,
        PESSOAS.RACA,
        PESSOAS.FOTO_IMG
      From
        PESSOAS
      Where
        PESSOAS.CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    const loginRows = await this.legacyDatabaseService.query<SolicitacaoFiliacaoLoginRow>(
      `
      Select Top 1
        PESSOAS_LOGIN.EMAIL
      From
        PESSOAS_LOGIN
      Where
        PESSOAS_LOGIN.CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    const draftRows = await this.legacyDatabaseService.query<SolicitacaoFiliacaoDraftRow>(
      `
      Select Top 1
        AGG_FILIACAO.REGISTRO,
        AGG_FILIACAO.STATUS,
        AGG_FILIACAO.PROTOCOLO,
        AGG_FILIACAO.NOME,
        AGG_FILIACAO.NOME_SOCIAL,
        AGG_FILIACAO.PAI,
        AGG_FILIACAO.MAE,
        AGG_FILIACAO.NATURALIDADE,
        AGG_FILIACAO.CEP,
        AGG_FILIACAO.ENDERECO,
        AGG_FILIACAO.NUMERO,
        AGG_FILIACAO.COMPLEMENTO,
        AGG_FILIACAO.BAIRRO,
        AGG_FILIACAO.CIDADE,
        AGG_FILIACAO.ESTADO,
        AGG_FILIACAO.TELEFONE,
        AGG_FILIACAO.CELULAR,
        AGG_FILIACAO.CELULARII,
        AGG_FILIACAO.DATANASCIMENTO,
        AGG_FILIACAO.EMAIL,
        AGG_FILIACAO.ESTADOCIVIL,
        AGG_FILIACAO.ESPECIFICAR_GENERO,
        AGG_FILIACAO.ORIENTACAO_SEXUAL,
        AGG_FILIACAO.SEXO,
        AGG_FILIACAO.RG,
        AGG_FILIACAO.DATAEXPRG,
        AGG_FILIACAO.SANGUE_TP_RH,
        AGG_FILIACAO.RG_ORGAO,
        AGG_FILIACAO.RG_UF,
        AGG_FILIACAO.RACA,
        AGG_FILIACAO.MATRICULA_ORGAO,
        AGG_FILIACAO.CODIGO_EMPRESA,
        AGG_FILIACAO.CODIGO_PREDIO,
        AGG_FILIACAO.SITUACAO_FUNCIONAL,
        AGG_FILIACAO.NIVELSALARIAL_ORGAO,
        AGG_FILIACAO.CARGO_ORGAO,
        AGG_FILIACAO.PROFISSAO_ORGAO,
        AGG_FILIACAO.FUNCAO_ORGAO,
        AGG_FILIACAO.VINCULO_ORGAO,
        AGG_FILIACAO.CARGAHORARIA_ORGAO,
        AGG_FILIACAO.ADMISSAO_ORGAO,
        AGG_FILIACAO.APOSENTADORIA_ORGAO,
        AGG_FILIACAO.DESCONTAR_INSS,
        AGG_FILIACAO.DATA_DESCONTO_INSS,
        AGG_FILIACAO.NUMERO_BENEFICIO_INSS,
        AGG_FILIACAO.CODIGO_ESPECIE_INSS,
        AGG_FILIACAO.ADICIONAR_OUTRA_FILIACAO,
        AGG_FILIACAO.MATRICULA_ORGAOI,
        AGG_FILIACAO.CODIGO_EMPRESAI,
        AGG_FILIACAO.CODIGO_PREDIOI,
        AGG_FILIACAO.SITUACAO_ORGAOI,
        AGG_FILIACAO.NIVELSALARIAL_ORGAOI,
        AGG_FILIACAO.CARGO_ORGAOI,
        AGG_FILIACAO.PROFISSAO_ORGAOI,
        AGG_FILIACAO.FUNCAO_ORGAOI,
        AGG_FILIACAO.VINCULO_ORGAOI,
        AGG_FILIACAO.CARGAHORARIA_ORGAOI,
        AGG_FILIACAO.ADMISSAO_ORGAOI,
        AGG_FILIACAO.APOSENTADORIA_ORGAOI,
        AGG_FILIACAO.DESCONTAR_INSSI,
        AGG_FILIACAO.DATA_DESCONTO_INSSI,
        AGG_FILIACAO.NUMERO_BENEFICIO_INSSI,
        AGG_FILIACAO.CODIGO_ESPECIE_INSSI,
        AGG_FILIACAO.AUTORIZAR_DESCONTO,
        AGG_FILIACAO.AUTORIZAR_LGPD,
        AGG_FILIACAO.TERMO_LGPD,
        AGG_FILIACAO.FOTO,
        AGG_FILIACAO.FOTO_RESIDENCIA,
        AGG_FILIACAO.FOTO_CONTRACHEQUE01,
        AGG_FILIACAO.FOTO_CONTRACHEQUE02,
        AGG_FILIACAO.FOTO_DOCUMENTO,
        AGG_FILIACAO.FOTO_RG_FRENTE,
        AGG_FILIACAO.FOTO_RG_VERSO
      From
        AGG_FILIACAO
      Where
        AGG_FILIACAO.CPF = @CPF
        And AGG_FILIACAO.STATUS In ('A', 'F')
      Order By
        AGG_FILIACAO.REGISTRO Desc
      `,
      { CPF: cpfDigits }
    );

    const sindicatoRows = await this.legacyDatabaseService.query<SolicitacaoFiliacaoTermosRow>(
      `
      Select Top 1
        SINDICATO.TEXTO_AUTORIZACAO_DESCONTO,
        SINDICATO.TERMO_LGPD,
        DBO.udf_TitleCase(SINDICATO.CIDADE) + '/' + SINDICATO.UF + ', ' + dbo.DataExtenso(GetDate()) As DATAEXTENSO
      From
        SINDICATO
      `
    );

    const pessoa = pessoaRows[0];
    const draft = draftRows[0];
    const sindicato = sindicatoRows[0];
    const normalizedStatus = this.normalizeScalar(draft?.STATUS)?.toUpperCase() ?? "";
    const hasDraftInProgress = normalizedStatus === "A";
    const shouldResetForNewRequest = normalizedStatus === "F";
    const estadoCivilResolved = await this.resolveEstadoCivil(
      cpfDigits,
      hasDraftInProgress ? draft?.ESTADOCIVIL : pessoa?.ESTADOCIVIL
    );

    const pickText = (
      draftValue: string | number | boolean | Date | Buffer | null | undefined,
      pessoaValue?: string | number | boolean | Date | Buffer | null | undefined
    ): string => {
      if (shouldResetForNewRequest) {
        return "";
      }
      if (hasDraftInProgress) {
        return this.normalizeScalar(draftValue) ?? "";
      }
      return this.normalizeScalar(pessoaValue) ?? "";
    };

    const pickDate = (draftValue: Date | string | null | undefined, pessoaValue?: Date | string | null): string | null => {
      if (shouldResetForNewRequest) {
        return null;
      }
      if (hasDraftInProgress) {
        return this.toDateIso(draftValue);
      }
      return this.toDateIso(pessoaValue ?? null);
    };

    const pickPhoto = (draftValue: Buffer | string | null | undefined, pessoaValue?: Buffer | string | null): string | null => {
      if (shouldResetForNewRequest) {
        return null;
      }
      if (hasDraftInProgress) {
        return this.toFotoDataUrl(draftValue);
      }
      return this.toFotoDataUrl(pessoaValue ?? null);
    };

    return {
      cpf: this.maskCpf(cpfDigits),
      solicitacaoStatus: hasDraftInProgress ? "A" : shouldResetForNewRequest ? "F" : null,
      hasDraftInProgress,
      nome: pickText(draft?.NOME, pessoa?.NOME),
      nomeSocial: pickText(draft?.NOME_SOCIAL, pessoa?.NOME_SOCIAL),
      pai: pickText(draft?.PAI, pessoa?.PAI),
      mae: pickText(draft?.MAE, pessoa?.MAE),
      naturalidade: pickText(draft?.NATURALIDADE, pessoa?.NATURALIDADE),
      cep: shouldResetForNewRequest
        ? ""
        : hasDraftInProgress
          ? this.normalizeCep(draft?.CEP ?? undefined) ?? ""
          : this.normalizeCep(pessoa?.CEP ?? undefined) ?? "",
      endereco: pickText(draft?.ENDERECO, pessoa?.ENDERECO),
      numero: pickText(draft?.NUMERO, pessoa?.NUMERO),
      complemento: pickText(draft?.COMPLEMENTO, pessoa?.COMPLEMENTO),
      bairro: pickText(draft?.BAIRRO, pessoa?.BAIRRO),
      cidade: pickText(draft?.CIDADE, pessoa?.CIDADE),
      estado: shouldResetForNewRequest
        ? ""
        : hasDraftInProgress
          ? this.normalizeScalar(draft?.ESTADO)?.toUpperCase() ?? ""
          : this.normalizeScalar(pessoa?.ESTADO)?.toUpperCase() ?? "",
      telefone: pickText(draft?.TELEFONE, pessoa?.TELEFONE),
      celular: pickText(draft?.CELULAR, pessoa?.CELULAR),
      celularIi: pickText(draft?.CELULARII, pessoa?.CELULARII),
      dataNascimento: pickDate(draft?.DATANASCIMENTO, pessoa?.DATANASCIMENTO),
      email: shouldResetForNewRequest
        ? ""
        : hasDraftInProgress
          ? this.normalizeScalar(draft?.EMAIL)?.toLowerCase() ?? ""
          : this.normalizeScalar(loginRows[0]?.EMAIL)?.toLowerCase() ?? "",
      estadoCivil: estadoCivilResolved,
      especificarGenero: pickText(draft?.ESPECIFICAR_GENERO, pessoa?.ESPECIFICAR_GENERO),
      orientacaoSexual: pickText(draft?.ORIENTACAO_SEXUAL, pessoa?.ORIENTACAO_SEXUAL),
      sexo: pickText(draft?.SEXO, pessoa?.SEXO),
      rg: pickText(draft?.RG, pessoa?.RG),
      dataExpRg: pickDate(draft?.DATAEXPRG, pessoa?.DATAEXPRG),
      sangueTpRh: pickText(draft?.SANGUE_TP_RH, pessoa?.SANGUE_TP_RH),
      rgOrgao: pickText(draft?.RG_ORGAO, pessoa?.RG_ORGAO),
      rgUf: pickText(draft?.RG_UF, pessoa?.RG_UF),
      raca: pickText(draft?.RACA, pessoa?.RACA),
      matriculaOrgao: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.MATRICULA_ORGAO) ?? "",
      codigoEmpresa: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CODIGO_EMPRESA) ?? "",
      codigoPredio: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CODIGO_PREDIO) ?? "",
      situacaoFuncional: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.SITUACAO_FUNCIONAL) ?? "",
      nivelSalarialOrgao: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.NIVELSALARIAL_ORGAO) ?? "",
      cargoOrgao: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CARGO_ORGAO) ?? "",
      profissaoOrgao: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.PROFISSAO_ORGAO) ?? "",
      funcaoOrgao: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.FUNCAO_ORGAO) ?? "",
      vinculoOrgao: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.VINCULO_ORGAO) ?? "",
      cargaHorariaOrgao: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CARGAHORARIA_ORGAO) ?? "",
      admissaoOrgao: shouldResetForNewRequest ? null : this.toDateIso(draft?.ADMISSAO_ORGAO),
      aposentadoriaOrgao: shouldResetForNewRequest ? null : this.toDateIso(draft?.APOSENTADORIA_ORGAO),
      descontarInss: shouldResetForNewRequest ? "" : this.toInssOption(draft?.DESCONTAR_INSS),
      dataDescontoInss: shouldResetForNewRequest ? null : this.toDateIso(draft?.DATA_DESCONTO_INSS),
      numeroBeneficioInss: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.NUMERO_BENEFICIO_INSS) ?? "",
      codigoEspecieInss: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CODIGO_ESPECIE_INSS) ?? "",
      adicionarOutraFiliacao: shouldResetForNewRequest ? false : this.isFlagEnabled(draft?.ADICIONAR_OUTRA_FILIACAO),
      matriculaOrgaoI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.MATRICULA_ORGAOI) ?? "",
      codigoEmpresaI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CODIGO_EMPRESAI) ?? "",
      codigoPredioI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CODIGO_PREDIOI) ?? "",
      situacaoOrgaoI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.SITUACAO_ORGAOI) ?? "",
      nivelSalarialOrgaoI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.NIVELSALARIAL_ORGAOI) ?? "",
      cargoOrgaoI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CARGO_ORGAOI) ?? "",
      profissaoOrgaoI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.PROFISSAO_ORGAOI) ?? "",
      funcaoOrgaoI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.FUNCAO_ORGAOI) ?? "",
      vinculoOrgaoI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.VINCULO_ORGAOI) ?? "",
      cargaHorariaOrgaoI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CARGAHORARIA_ORGAOI) ?? "",
      admissaoOrgaoI: shouldResetForNewRequest ? null : this.toDateIso(draft?.ADMISSAO_ORGAOI),
      aposentadoriaOrgaoI: shouldResetForNewRequest ? null : this.toDateIso(draft?.APOSENTADORIA_ORGAOI),
      descontarInssI: shouldResetForNewRequest ? "" : this.toInssOption(draft?.DESCONTAR_INSSI),
      dataDescontoInssI: shouldResetForNewRequest ? null : this.toDateIso(draft?.DATA_DESCONTO_INSSI),
      numeroBeneficioInssI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.NUMERO_BENEFICIO_INSSI) ?? "",
      codigoEspecieInssI: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.CODIGO_ESPECIE_INSSI) ?? "",
      autorizarDesconto: shouldResetForNewRequest ? false : hasDraftInProgress ? this.isFlagEnabled(draft?.AUTORIZAR_DESCONTO) : true,
      autorizarLgpd: shouldResetForNewRequest ? false : hasDraftInProgress ? this.isFlagEnabled(draft?.AUTORIZAR_LGPD) : true,
      termoLgpdConfirmacao: shouldResetForNewRequest ? "" : this.normalizeScalar(draft?.TERMO_LGPD) ?? "",
      termoAutorizacaoDesconto: this.normalizeScalar(sindicato?.TEXTO_AUTORIZACAO_DESCONTO) ?? "",
      termoLgpdTexto: this.normalizeScalar(sindicato?.TERMO_LGPD) ?? "",
      termoLgpdDataExtenso: this.normalizeScalar(sindicato?.DATAEXTENSO) ?? "",
      fotoPerfilUrl: pickPhoto(draft?.FOTO, pessoa?.FOTO_IMG),
      fotoResidenciaUrl: shouldResetForNewRequest ? null : this.toFotoDataUrl(draft?.FOTO_RESIDENCIA),
      fotoContracheque01Url: shouldResetForNewRequest ? null : this.toFotoDataUrl(draft?.FOTO_CONTRACHEQUE01),
      fotoContracheque02Url: shouldResetForNewRequest ? null : this.toFotoDataUrl(draft?.FOTO_CONTRACHEQUE02),
      fotoDocumentoUrl: shouldResetForNewRequest ? null : this.toFotoDataUrl(draft?.FOTO_DOCUMENTO),
      fotoRgFrenteUrl: shouldResetForNewRequest ? null : this.toFotoDataUrl(draft?.FOTO_RG_FRENTE),
      fotoRgVersoUrl: shouldResetForNewRequest ? null : this.toFotoDataUrl(draft?.FOTO_RG_VERSO),
      fatoresSanguineos: this.getLookupFatoresSanguineos()
    };
  }

  async getLookupFiliacaoVinculos() {
    const [empresas, situacoes, niveis, cargos, funcoes, profissoes, vinculos, especiesInss] = await Promise.all([
      this.legacyDatabaseService.query<LookupCodigoDescricaoRow>(
        `
        Select
          EMPRESA.CODIGO,
          EMPRESA.DESCRICAO
        From
          EMPRESA
        Order By
          EMPRESA.DESCRICAO
        `
      ),
      this.legacyDatabaseService.query<LookupCodigoDescricaoRow>(
        `
        Select
          SITUACAO_FILIADO.CODIGO,
          SITUACAO_FILIADO.DESCRICAO
        From
          SITUACAO_FILIADO
        Where (
          (SITUACAO_FILIADO.WEB = 1) And
          (SITUACAO_FILIADO.ATIVO = 1))
        Order By
          SITUACAO_FILIADO.DESCRICAO
        `
      ),
      this.legacyDatabaseService.query<LookupCodigoDescricaoRow>(
        `
        Select
          NIVEL.CODIGO,
          NIVEL.DESCRICAO
        From
          NIVEL
        Order By
          NIVEL.DESCRICAO
        `
      ),
      this.legacyDatabaseService.query<LookupCodigoDescricaoRow>(
        `
        Select
          CARGO.CODIGO,
          CARGO.DESCRICAO
        From
          CARGO
        Order By
          CARGO.DESCRICAO
        `
      ),
      this.legacyDatabaseService.query<LookupCodigoDescricaoRow>(
        `
        Select
          FUNCOES.CODIGO,
          FUNCOES.DESCRICAO
        From
          FUNCOES
        Order By
          FUNCOES.DESCRICAO
        `
      ),
      this.legacyDatabaseService.query<LookupCodigoDescricaoRow>(
        `
        Select
          PROFISSAO.CODIGO,
          PROFISSAO.DESCRICAO
        From
          PROFISSAO
        Order By
          PROFISSAO.DESCRICAO
        `
      ),
      this.legacyDatabaseService.query<LookupCodigoDescricaoRow>(
        `
        Select
          VINCULO_EMPREGATICIO.CODIGO,
          VINCULO_EMPREGATICIO.DESCRICAO
        From
          VINCULO_EMPREGATICIO
        Order By
          VINCULO_EMPREGATICIO.DESCRICAO
        `
      ),
      this.legacyDatabaseService.query<LookupCodigoDescricaoRow>(
        `
        Select
          CAD_ESPECIE_INSS.CODIGO,
          CAD_ESPECIE_INSS.CODIGO + ' - ' + CAD_ESPECIE_INSS.DESCRICAO As DESCRICAO
        From
          CAD_ESPECIE_INSS
        `
      )
    ]);

    const toOption = (rows: LookupCodigoDescricaoRow[]) =>
      rows.map((row) => ({
        value: String(row.CODIGO ?? "").trim(),
        label: row.DESCRICAO?.trim() ?? ""
      }));

    return {
      empresas: toOption(empresas),
      situacoesFuncionais: toOption(situacoes),
      niveisCarreira: toOption(niveis),
      cargos: toOption(cargos),
      funcoesMagisterio: toOption(funcoes),
      formacoesProfissionais: toOption(profissoes),
      regimesTrabalho: toOption(vinculos),
      especiesInss: toOption(especiesInss)
    };
  }

  private async generateUniqueProtocolo(): Promise<string> {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const protocoloCandidate = randomUUID().toUpperCase();
      const rows = await this.legacyDatabaseService.query<ProtocoloExistsRow>(
        `
        Select Top 1
          AGG_FILIACAO.PROTOCOLO
        From
          AGG_FILIACAO
        Where
          AGG_FILIACAO.PROTOCOLO = @PROTOCOLO
        `,
        { PROTOCOLO: protocoloCandidate }
      );

      if (rows.length === 0) {
        return protocoloCandidate;
      }
    }

    throw new InternalServerErrorException("Não foi possível gerar protocolo único de filiação.");
  }

  async createSolicitarFiliacao(payload: CreateSolicitacaoFiliacaoDto, requestIp?: string | null) {
    const cpfDigits = this.sanitizeCpf(payload.cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const loginRows = await this.legacyDatabaseService.query<SolicitacaoFiliacaoLoginRow>(
      `
      Select Top 1
        PESSOAS_LOGIN.EMAIL
      From
        PESSOAS_LOGIN
      Where
        PESSOAS_LOGIN.CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    const emailBloqueado = this.normalizeOptionalText(loginRows[0]?.EMAIL ?? undefined)?.toLowerCase() ?? null;

    const requiredFields = [
      { label: "Nome Completo", value: payload.nome },
      { label: "RG", value: payload.rg },
      { label: "Nome da Mãe", value: payload.mae },
      { label: "Celular/WhatsApp", value: payload.celular },
      { label: "CEP", value: payload.cep },
      { label: "Endereço", value: payload.endereco },
      { label: "Número", value: payload.numero },
      { label: "Bairro", value: payload.bairro },
      { label: "UF", value: payload.estado },
      { label: "Cidade", value: payload.cidade },
      { label: "Matricula", value: payload.matriculaOrgao },
      { label: "Ente publico", value: payload.codigoEmpresa }
    ];

    for (const field of requiredFields) {
      if ((field.value ?? "").trim().length === 0) {
        throw new BadRequestException(`O campo ${field.label} e obrigatorio.`);
      }
    }

    if (!payload.autorizarDesconto) {
      throw new BadRequestException("E obrigatorio concordar com o termo de autorizacao do desconto sindical.");
    }

    if (!payload.autorizarLgpd) {
      throw new BadRequestException("E obrigatorio concordar com os termos da L.G.P.D.");
    }

    const hasFotoPerfil = typeof payload.fotoPerfilBase64 === "string" && payload.fotoPerfilBase64.trim().length > 0;
    const hasComprovanteResidencia =
      typeof payload.fotoResidenciaBase64 === "string" && payload.fotoResidenciaBase64.trim().length > 0;
    const hasContracheque01 =
      typeof payload.fotoContracheque01Base64 === "string" && payload.fotoContracheque01Base64.trim().length > 0;
    const hasDocumentoFotoFrente =
      typeof payload.fotoRgFrenteBase64 === "string" && payload.fotoRgFrenteBase64.trim().length > 0;
    const hasDocumentoFotoVerso =
      typeof payload.fotoRgVersoBase64 === "string" && payload.fotoRgVersoBase64.trim().length > 0;

    if (!hasFotoPerfil || !hasComprovanteResidencia || !hasContracheque01 || !hasDocumentoFotoFrente || !hasDocumentoFotoVerso) {
      throw new BadRequestException(
        "Anexe os documentos obrigatorios: foto perfil, comprovante de residencia, contracheque, RG frente e RG verso."
      );
    }

    const openDraftRows = await this.legacyDatabaseService.query<SolicitacaoFiliacaoDraftRow>(
      `
      Select Top 1
        AGG_FILIACAO.REGISTRO,
        AGG_FILIACAO.PROTOCOLO
      From
        AGG_FILIACAO
      Where
        AGG_FILIACAO.CPF = @CPF
        And AGG_FILIACAO.STATUS = 'A'
      Order By
        AGG_FILIACAO.REGISTRO Desc
      `,
      { CPF: cpfDigits }
    );

    const openDraft = openDraftRows[0];
    const draftRegistro = this.normalizeScalar(openDraft?.REGISTRO);
    const protocolo = this.normalizeScalar(openDraft?.PROTOCOLO) ?? (await this.generateUniqueProtocolo());

    const photoPerfilBuffer = this.parseOptionalImage(payload.fotoPerfilBase64, "Foto perfil");
    const comprovanteBuffer = this.parseOptionalImage(payload.fotoResidenciaBase64, "Comprovante de residencia");
    const contracheque01Buffer = this.parseOptionalImage(payload.fotoContracheque01Base64, "Contracheque 01");
    const contracheque02Buffer = this.parseOptionalImage(payload.fotoContracheque02Base64, "Contracheque 02");
    const fotoDocumentoBuffer = this.parseOptionalImage(payload.fotoDocumentoBase64, "Selfie com documento");
    const rgFrenteBuffer = this.parseOptionalImage(payload.fotoRgFrenteBase64, "RG frente");
    const rgVersoBuffer = this.parseOptionalImage(payload.fotoRgVersoBase64, "RG verso");

    const persistenceParams = {
      STATUS: "F",
      SITUACAO: "1",
      CPF: cpfDigits,
      NOME: this.normalizeOptionalText(payload.nome),
      NOME_SOCIAL: this.normalizeOptionalText(payload.nomeSocial),
      PAI: this.normalizeOptionalText(payload.pai),
      MAE: this.normalizeOptionalText(payload.mae),
      NATURALIDADE: this.normalizeOptionalText(payload.naturalidade),
      CEP: this.normalizeCep(payload.cep),
      ENDERECO: this.normalizeOptionalText(payload.endereco),
      NUMERO: this.normalizeOptionalText(payload.numero),
      COMPLEMENTO: this.normalizeOptionalText(payload.complemento),
      BAIRRO: this.normalizeOptionalText(payload.bairro),
      CIDADE: this.normalizeOptionalText(payload.cidade),
      ESTADO: this.normalizeOptionalText(payload.estado)?.toUpperCase() ?? null,
      TELEFONE: this.sanitizePhone(payload.telefone),
      CELULAR: this.sanitizePhone(payload.celular),
      CELULARII: this.sanitizePhone(payload.celularIi),
      DATANASCIMENTO: this.toDateValue(payload.dataNascimento),
      EMAIL: emailBloqueado ?? this.normalizeOptionalText(payload.email)?.toLowerCase() ?? null,
      ESTADOCIVIL: this.normalizeOptionalText(payload.estadoCivil),
      ESPECIFICAR_GENERO: this.normalizeOptionalText(payload.especificarGenero),
      ORIENTACAO_SEXUAL: this.normalizeOptionalText(payload.orientacaoSexual),
      SEXO: this.normalizeOptionalText(payload.sexo),
      RG: this.normalizeOptionalText(payload.rg),
      DATA_REGISTRO: new Date(),
      FOTO: photoPerfilBuffer,
      FOTO_RESIDENCIA: comprovanteBuffer,
      FOTO_CONTRACHEQUE01: contracheque01Buffer,
      FOTO_CONTRACHEQUE02: contracheque02Buffer,
      FOTO_DOCUMENTO: fotoDocumentoBuffer,
      FOTO_RG_FRENTE: rgFrenteBuffer,
      FOTO_RG_VERSO: rgVersoBuffer,
      PROTOCOLO: protocolo,
      IP: this.normalizeIpAddress(requestIp),
      DATAEXPRG: this.toDateValue(payload.dataExpRg),
      SANGUE_TP_RH: this.normalizeOptionalText(payload.sangueTpRh),
      RG_ORGAO: this.normalizeOptionalText(payload.rgOrgao),
      RG_UF: this.normalizeOptionalText(payload.rgUf)?.toUpperCase() ?? null,
      RACA: this.normalizeOptionalText(payload.raca),
      MATRICULA_ORGAO: this.normalizeOptionalText(payload.matriculaOrgao),
      REGIAO_ORGAO: this.normalizeOptionalText(payload.estado)?.toUpperCase() ?? null,
      NIVELSALARIAL_ORGAO: this.normalizeOptionalText(payload.nivelSalarialOrgao),
      CARGAHORARIA_ORGAO: this.normalizeOptionalText(payload.cargaHorariaOrgao),
      SITUACAO_FUNCIONAL: this.normalizeOptionalText(payload.situacaoFuncional),
      CARGO_ORGAO: this.normalizeOptionalText(payload.cargoOrgao),
      FUNCAO_ORGAO: this.normalizeOptionalText(payload.funcaoOrgao),
      PROFISSAO_ORGAO: this.normalizeOptionalText(payload.profissaoOrgao),
      VINCULO_ORGAO: this.normalizeOptionalText(payload.vinculoOrgao),
      ADMISSAO_ORGAO: this.toDateValue(payload.admissaoOrgao),
      APOSENTADORIA_ORGAO: this.toDateValue(payload.aposentadoriaOrgao),
      ADICIONAR_OUTRA_FILIACAO: this.boolToLegacy(payload.adicionarOutraFiliacao),
      MATRICULA_ORGAOI: this.normalizeOptionalText(payload.matriculaOrgaoI),
      REGIAO_ORGAOI: this.normalizeOptionalText(payload.estado)?.toUpperCase() ?? null,
      NIVELSALARIAL_ORGAOI: this.normalizeOptionalText(payload.nivelSalarialOrgaoI),
      CARGAHORARIA_ORGAOI: this.normalizeOptionalText(payload.cargaHorariaOrgaoI),
      SITUACAO_ORGAOI: this.normalizeOptionalText(payload.situacaoOrgaoI),
      CARGO_ORGAOI: this.normalizeOptionalText(payload.cargoOrgaoI),
      FUNCAO_ORGAOI: this.normalizeOptionalText(payload.funcaoOrgaoI),
      PROFISSAO_ORGAOI: this.normalizeOptionalText(payload.profissaoOrgaoI),
      VINCULO_ORGAOI: this.normalizeOptionalText(payload.vinculoOrgaoI),
      ADMISSAO_ORGAOI: this.toDateValue(payload.admissaoOrgaoI),
      APOSENTADORIA_ORGAOI: this.toDateValue(payload.aposentadoriaOrgaoI),
      AUTORIZAR_DESCONTO: this.boolToLegacy(payload.autorizarDesconto),
      AUTORIZAR_LGPD: this.boolToLegacy(payload.autorizarLgpd),
      TERMO_LGPD: this.normalizeOptionalText(payload.termoLgpd),
      CODIGO_EMPRESA: this.normalizeOptionalText(payload.codigoEmpresa),
      CODIGO_EMPRESAI: this.normalizeOptionalText(payload.codigoEmpresaI),
      CODIGO_PREDIO: this.normalizeOptionalText(payload.codigoPredio),
      CODIGO_PREDIOI: this.normalizeOptionalText(payload.codigoPredioI),
      DESCONTAR_INSS: payload.descontarInss ?? "N",
      DATA_DESCONTO_INSS: this.toDateValue(payload.dataDescontoInss),
      NUMERO_BENEFICIO_INSS: this.normalizeOptionalText(payload.numeroBeneficioInss),
      CODIGO_ESPECIE_INSS: this.normalizeOptionalText(payload.codigoEspecieInss),
      DESCONTAR_INSSI: payload.descontarInssI ?? "N",
      DATA_DESCONTO_INSSI: this.toDateValue(payload.dataDescontoInssI),
      CODIGO_ESPECIE_INSSI: this.normalizeOptionalText(payload.codigoEspecieInssI),
      NUMERO_BENEFICIO_INSSI: this.normalizeOptionalText(payload.numeroBeneficioInssI)
    };

    if (draftRegistro) {
      await this.legacyDatabaseService.query(
        `
        Update AGG_FILIACAO
        Set
          STATUS = @STATUS,
          SITUACAO = @SITUACAO,
          CPF = @CPF,
          NOME = @NOME,
          NOME_SOCIAL = @NOME_SOCIAL,
          PAI = @PAI,
          MAE = @MAE,
          NATURALIDADE = @NATURALIDADE,
          CEP = @CEP,
          ENDERECO = @ENDERECO,
          NUMERO = @NUMERO,
          COMPLEMENTO = @COMPLEMENTO,
          BAIRRO = @BAIRRO,
          CIDADE = @CIDADE,
          ESTADO = @ESTADO,
          TELEFONE = @TELEFONE,
          CELULAR = @CELULAR,
          CELULARII = @CELULARII,
          DATANASCIMENTO = @DATANASCIMENTO,
          EMAIL = @EMAIL,
          ESTADOCIVIL = @ESTADOCIVIL,
          ESPECIFICAR_GENERO = @ESPECIFICAR_GENERO,
          ORIENTACAO_SEXUAL = @ORIENTACAO_SEXUAL,
          SEXO = @SEXO,
          RG = @RG,
          DATA_REGISTRO = @DATA_REGISTRO,
          FOTO = @FOTO,
          FOTO_RESIDENCIA = @FOTO_RESIDENCIA,
          FOTO_CONTRACHEQUE01 = @FOTO_CONTRACHEQUE01,
          FOTO_CONTRACHEQUE02 = @FOTO_CONTRACHEQUE02,
          FOTO_DOCUMENTO = @FOTO_DOCUMENTO,
          FOTO_RG_FRENTE = @FOTO_RG_FRENTE,
          FOTO_RG_VERSO = @FOTO_RG_VERSO,
          PROTOCOLO = @PROTOCOLO,
          IP = @IP,
          DATAEXPRG = @DATAEXPRG,
          SANGUE_TP_RH = @SANGUE_TP_RH,
          RG_ORGAO = @RG_ORGAO,
          RG_UF = @RG_UF,
          RACA = @RACA,
          MATRICULA_ORGAO = @MATRICULA_ORGAO,
          REGIAO_ORGAO = @REGIAO_ORGAO,
          NIVELSALARIAL_ORGAO = @NIVELSALARIAL_ORGAO,
          CARGAHORARIA_ORGAO = @CARGAHORARIA_ORGAO,
          SITUACAO_FUNCIONAL = @SITUACAO_FUNCIONAL,
          CARGO_ORGAO = @CARGO_ORGAO,
          FUNCAO_ORGAO = @FUNCAO_ORGAO,
          PROFISSAO_ORGAO = @PROFISSAO_ORGAO,
          VINCULO_ORGAO = @VINCULO_ORGAO,
          ADMISSAO_ORGAO = @ADMISSAO_ORGAO,
          APOSENTADORIA_ORGAO = @APOSENTADORIA_ORGAO,
          ADICIONAR_OUTRA_FILIACAO = @ADICIONAR_OUTRA_FILIACAO,
          MATRICULA_ORGAOI = @MATRICULA_ORGAOI,
          REGIAO_ORGAOI = @REGIAO_ORGAOI,
          NIVELSALARIAL_ORGAOI = @NIVELSALARIAL_ORGAOI,
          CARGAHORARIA_ORGAOI = @CARGAHORARIA_ORGAOI,
          SITUACAO_ORGAOI = @SITUACAO_ORGAOI,
          CARGO_ORGAOI = @CARGO_ORGAOI,
          FUNCAO_ORGAOI = @FUNCAO_ORGAOI,
          PROFISSAO_ORGAOI = @PROFISSAO_ORGAOI,
          VINCULO_ORGAOI = @VINCULO_ORGAOI,
          ADMISSAO_ORGAOI = @ADMISSAO_ORGAOI,
          APOSENTADORIA_ORGAOI = @APOSENTADORIA_ORGAOI,
          AUTORIZAR_DESCONTO = @AUTORIZAR_DESCONTO,
          AUTORIZAR_LGPD = @AUTORIZAR_LGPD,
          TERMO_LGPD = @TERMO_LGPD,
          CODIGO_EMPRESA = @CODIGO_EMPRESA,
          CODIGO_EMPRESAI = @CODIGO_EMPRESAI,
          CODIGO_PREDIO = @CODIGO_PREDIO,
          CODIGO_PREDIOI = @CODIGO_PREDIOI,
          DESCONTAR_INSS = @DESCONTAR_INSS,
          DATA_DESCONTO_INSS = @DATA_DESCONTO_INSS,
          NUMERO_BENEFICIO_INSS = @NUMERO_BENEFICIO_INSS,
          CODIGO_ESPECIE_INSS = @CODIGO_ESPECIE_INSS,
          DESCONTAR_INSSI = @DESCONTAR_INSSI,
          DATA_DESCONTO_INSSI = @DATA_DESCONTO_INSSI,
          CODIGO_ESPECIE_INSSI = @CODIGO_ESPECIE_INSSI,
          NUMERO_BENEFICIO_INSSI = @NUMERO_BENEFICIO_INSSI
        Where
          REGISTRO = @REGISTRO
        `,
        {
          ...persistenceParams,
          REGISTRO: draftRegistro
        }
      );
    } else {
      await this.legacyDatabaseService.query(
        `
        Insert Into AGG_FILIACAO
          (
            STATUS,
            SITUACAO,
            CPF,
            NOME,
            NOME_SOCIAL,
            PAI,
            MAE,
            NATURALIDADE,
            CEP,
            ENDERECO,
            NUMERO,
            COMPLEMENTO,
            BAIRRO,
            CIDADE,
            ESTADO,
            TELEFONE,
            CELULAR,
            CELULARII,
            DATANASCIMENTO,
            EMAIL,
            ESTADOCIVIL,
            ESPECIFICAR_GENERO,
            ORIENTACAO_SEXUAL,
            SEXO,
            RG,
            DATA_REGISTRO,
            FOTO,
            FOTO_RESIDENCIA,
            FOTO_CONTRACHEQUE01,
            FOTO_CONTRACHEQUE02,
            FOTO_DOCUMENTO,
            FOTO_RG_FRENTE,
            FOTO_RG_VERSO,
            PROTOCOLO,
            IP,
            DATAEXPRG,
            SANGUE_TP_RH,
            RG_ORGAO,
            RG_UF,
            RACA,
            MATRICULA_ORGAO,
            REGIAO_ORGAO,
            NIVELSALARIAL_ORGAO,
            CARGAHORARIA_ORGAO,
            SITUACAO_FUNCIONAL,
            CARGO_ORGAO,
            FUNCAO_ORGAO,
            PROFISSAO_ORGAO,
            VINCULO_ORGAO,
            ADMISSAO_ORGAO,
            APOSENTADORIA_ORGAO,
            ADICIONAR_OUTRA_FILIACAO,
            MATRICULA_ORGAOI,
            REGIAO_ORGAOI,
            NIVELSALARIAL_ORGAOI,
            CARGAHORARIA_ORGAOI,
            SITUACAO_ORGAOI,
            CARGO_ORGAOI,
            FUNCAO_ORGAOI,
            PROFISSAO_ORGAOI,
            VINCULO_ORGAOI,
            ADMISSAO_ORGAOI,
            APOSENTADORIA_ORGAOI,
            AUTORIZAR_DESCONTO,
            AUTORIZAR_LGPD,
            TERMO_LGPD,
            CODIGO_EMPRESA,
            CODIGO_EMPRESAI,
            CODIGO_PREDIO,
            CODIGO_PREDIOI,
            DESCONTAR_INSS,
            DATA_DESCONTO_INSS,
            NUMERO_BENEFICIO_INSS,
            CODIGO_ESPECIE_INSS,
            DESCONTAR_INSSI,
            DATA_DESCONTO_INSSI,
            CODIGO_ESPECIE_INSSI,
            NUMERO_BENEFICIO_INSSI
          )
        Values
          (
            @STATUS,
            @SITUACAO,
            @CPF,
            @NOME,
            @NOME_SOCIAL,
            @PAI,
            @MAE,
            @NATURALIDADE,
            @CEP,
            @ENDERECO,
            @NUMERO,
            @COMPLEMENTO,
            @BAIRRO,
            @CIDADE,
            @ESTADO,
            @TELEFONE,
            @CELULAR,
            @CELULARII,
            @DATANASCIMENTO,
            @EMAIL,
            @ESTADOCIVIL,
            @ESPECIFICAR_GENERO,
            @ORIENTACAO_SEXUAL,
            @SEXO,
            @RG,
            @DATA_REGISTRO,
            @FOTO,
            @FOTO_RESIDENCIA,
            @FOTO_CONTRACHEQUE01,
            @FOTO_CONTRACHEQUE02,
            @FOTO_DOCUMENTO,
            @FOTO_RG_FRENTE,
            @FOTO_RG_VERSO,
            @PROTOCOLO,
            @IP,
            @DATAEXPRG,
            @SANGUE_TP_RH,
            @RG_ORGAO,
            @RG_UF,
            @RACA,
            @MATRICULA_ORGAO,
            @REGIAO_ORGAO,
            @NIVELSALARIAL_ORGAO,
            @CARGAHORARIA_ORGAO,
            @SITUACAO_FUNCIONAL,
            @CARGO_ORGAO,
            @FUNCAO_ORGAO,
            @PROFISSAO_ORGAO,
            @VINCULO_ORGAO,
            @ADMISSAO_ORGAO,
            @APOSENTADORIA_ORGAO,
            @ADICIONAR_OUTRA_FILIACAO,
            @MATRICULA_ORGAOI,
            @REGIAO_ORGAOI,
            @NIVELSALARIAL_ORGAOI,
            @CARGAHORARIA_ORGAOI,
            @SITUACAO_ORGAOI,
            @CARGO_ORGAOI,
            @FUNCAO_ORGAOI,
            @PROFISSAO_ORGAOI,
            @VINCULO_ORGAOI,
            @ADMISSAO_ORGAOI,
            @APOSENTADORIA_ORGAOI,
            @AUTORIZAR_DESCONTO,
            @AUTORIZAR_LGPD,
            @TERMO_LGPD,
            @CODIGO_EMPRESA,
            @CODIGO_EMPRESAI,
            @CODIGO_PREDIO,
            @CODIGO_PREDIOI,
            @DESCONTAR_INSS,
            @DATA_DESCONTO_INSS,
            @NUMERO_BENEFICIO_INSS,
            @CODIGO_ESPECIE_INSS,
            @DESCONTAR_INSSI,
            @DATA_DESCONTO_INSSI,
            @CODIGO_ESPECIE_INSSI,
            @NUMERO_BENEFICIO_INSSI
          )
        `,
        persistenceParams
      );
    }

    return {
      success: true,
      protocolo,
      message: "Solicitação de filiação enviada com sucesso."
    };
  }

  async getProtocoloRelatorio(protocolo?: string, cpf?: string) {
    const protocoloKey = (protocolo ?? "").trim();
    if (!protocoloKey) {
      throw new BadRequestException("Protocolo inválido.");
    }

    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    const rows = await this.legacyDatabaseService.query<ProtocoloRelatorioRow>(
      `
      Select Top 1
        AGG_FILIACAO.CPF As CPFAGGFILIACAO,
        AGG_FILIACAO.NOME,
        AGG_FILIACAO.PAI,
        AGG_FILIACAO.MAE,
        AGG_FILIACAO.NATURALIDADE,
        AGG_FILIACAO.CEP,
        AGG_FILIACAO.ENDERECO,
        AGG_FILIACAO.COMPLEMENTO,
        AGG_FILIACAO.BAIRRO,
        AGG_FILIACAO.CIDADE,
        AGG_FILIACAO.ESTADO,
        AGG_FILIACAO.TELEFONE,
        AGG_FILIACAO.CELULAR,
        AGG_FILIACAO.CELULARII,
        AGG_FILIACAO.DATANASCIMENTO,
        Upper(AGG_FILIACAO.EMAIL) As EMAILMAIUSCULO,
        AGG_FILIACAO.ESTADOCIVIL,
        Concat(SubString(AGG_FILIACAO.RG, 1, Len(AGG_FILIACAO.RG) - 3), Replicate('*', 3)) As RGOCULTO,
        AGG_FILIACAO.DATA_REGISTRO,
        AGG_FILIACAO.FOTO_RESIDENCIA,
        AGG_FILIACAO.FOTO_CONTRACHEQUE01,
        AGG_FILIACAO.FOTO_CONTRACHEQUE02,
        AGG_FILIACAO.FOTO_RG_FRENTE,
        AGG_FILIACAO.FOTO_RG_VERSO,
        AGG_FILIACAO.PROTOCOLO,
        AGG_FILIACAO.IP,
        AGG_FILIACAO.DATAEXPRG,
        AGG_FILIACAO.SANGUE_TP_RH,
        AGG_FILIACAO.RG_ORGAO,
        AGG_FILIACAO.RG_UF,
        'Nº Protocolo: ' + IsNull(AGG_FILIACAO.PROTOCOLO, '') As NRPROTOCOLO,
        AGG_FILIACAO.RACA,
        AGG_FILIACAO.MATRICULA_ORGAO,
        AGG_FILIACAO.CARGAHORARIA_ORGAO,
        AGG_FILIACAO.ADMISSAO_ORGAO,
        AGG_FILIACAO.APOSENTADORIA_ORGAO,
        AGG_FILIACAO.ADICIONAR_OUTRA_FILIACAO,
        AGG_FILIACAO.MATRICULA_ORGAOI,
        AGG_FILIACAO.ADMISSAO_ORGAOI,
        AGG_FILIACAO.APOSENTADORIA_ORGAOI,
        SITUACAO_FILIADO.DESCRICAO As SITUACAO_FILIACAO,
        SITUACAO_FILIADO1.DESCRICAO As SITUACAO_ORGAO,
        NIVEL.DESCRICAO As NIVEL_ORGAO,
        NIVEL1.DESCRICAO As NIVEL_ORGAO_I,
        FUNCOES.DESCRICAO As FUNCAO_ORGAO,
        FUNCOES1.DESCRICAO As FUNCAO_ORGAO_I,
        PROFISSAO.DESCRICAO As PROFISSAO_ORGAO,
        PROFISSAO1.DESCRICAO As PROFISSAO_ORGAO_I,
        VINCULO_EMPREGATICIO.DESCRICAO As VINCULO_EMPREGATICIO_ORGAO,
        VINCULO_EMPREGATICIO1.DESCRICAO As VINCULO_EMPREGATICIO_ORGAO_I,
        AGG_FILIACAO.NUMERO,
        AGG_FILIACAO.FOTO,
        'EU, ' + AGG_FILIACAO.NOME + ', ' + Case
          When IsNull(AGG_FILIACAO.AUTORIZAR_DESCONTO, 0) = 0 Then 'NÃO AUTORIZO O DESCONTO.'
          Else 'AUTORIZO O DESCONTO.'
        End As AUTORIZARDESCONTO,
        'EU, ' + AGG_FILIACAO.NOME + ', ' + Case
          When IsNull(AGG_FILIACAO.AUTORIZAR_LGPD, 0) = 0 Then 'NÃO ESTOU DE ACORDO COM OS TERMOS DA L.G.P.D.'
          Else 'ESTOU DE ACORDO COM OS TERMOS DA L.G.P.D.'
        End As TERMOLGPD,
        EMPRESA.DESCRICAO As ENTEPUBLICO,
        EMPRESA1.DESCRICAO As ENTEPUBLICOI,
        AGG_FILIACAO.CODIGO_EMPRESA,
        AGG_FILIACAO.CODIGO_EMPRESAI,
        AGG_FILIACAO.CODIGO_PREDIO,
        AGG_FILIACAO.CODIGO_PREDIOI,
        AGG_FILIACAO.SITUACAO_FUNCIONAL,
        AGG_FILIACAO.TERMO_LGPD As TEXTO_LGPD,
        Upper(Case When AGG_FILIACAO.DESCONTAR_INSS = 1 Then 'Sim' Else 'Não' End) As DESCONTAR_INSSMAIUSCULO,
        AGG_FILIACAO.DATA_DESCONTO_INSS,
        AGG_FILIACAO.NUMERO_BENEFICIO_INSS,
        Upper(Case When AGG_FILIACAO.DESCONTAR_INSSI = 1 Then 'Sim' Else 'Não' End) As DESCONTAR_INSSIMAIUSCULO,
        AGG_FILIACAO.DATA_DESCONTO_INSSI,
        AGG_FILIACAO.NUMERO_BENEFICIO_INSSI,
        CAD_ESPECIE_INSS.DESCRICAO As ESPECIE_INSS,
        CAD_ESPECIE_INSS1.DESCRICAO As ESPECIE_INSS_I,
        AGG_FILIACAO.FOTO_DOCUMENTO,
        AGG_FILIACAO.ESPECIFICAR_GENERO,
        AGG_FILIACAO.ORIENTACAO_SEXUAL,
        AGG_FILIACAO.NOME_SOCIAL,
        Upper(GENERO.DESCRICAO) As SEXOMAIUSCULO,
        CARGO.DESCRICAO As CARGO,
        CARGO1.DESCRICAO As CARGO1
      From
        AGG_FILIACAO
        Left Join SITUACAO_FILIADO SITUACAO_FILIADO1 On AGG_FILIACAO.SITUACAO_ORGAOI = SITUACAO_FILIADO1.CODIGO
        Left Join NIVEL On AGG_FILIACAO.NIVELSALARIAL_ORGAO = NIVEL.CODIGO
        Left Join NIVEL NIVEL1 On AGG_FILIACAO.NIVELSALARIAL_ORGAOI = NIVEL1.CODIGO
        Left Join FUNCOES On AGG_FILIACAO.FUNCAO_ORGAO = FUNCOES.CODIGO
        Left Join FUNCOES FUNCOES1 On AGG_FILIACAO.FUNCAO_ORGAOI = FUNCOES1.CODIGO
        Left Join PROFISSAO On AGG_FILIACAO.PROFISSAO_ORGAO = PROFISSAO.CODIGO
        Left Join PROFISSAO PROFISSAO1 On AGG_FILIACAO.PROFISSAO_ORGAOI = PROFISSAO1.CODIGO
        Left Join VINCULO_EMPREGATICIO On AGG_FILIACAO.VINCULO_ORGAO = VINCULO_EMPREGATICIO.CODIGO
        Left Join VINCULO_EMPREGATICIO VINCULO_EMPREGATICIO1 On AGG_FILIACAO.VINCULO_ORGAOI = VINCULO_EMPREGATICIO1.CODIGO
        Left Join EMPRESA On AGG_FILIACAO.CODIGO_EMPRESA = EMPRESA.CODIGO
        Left Join EMPRESA EMPRESA1 On AGG_FILIACAO.CODIGO_EMPRESAI = EMPRESA1.CODIGO
        Left Join SITUACAO_FILIADO On AGG_FILIACAO.SITUACAO_FUNCIONAL = SITUACAO_FILIADO.CODIGO
        Left Join CAD_ESPECIE_INSS On AGG_FILIACAO.CODIGO_ESPECIE_INSS = CAD_ESPECIE_INSS.CODIGO
        Left Join CAD_ESPECIE_INSS CAD_ESPECIE_INSS1 On AGG_FILIACAO.CODIGO_ESPECIE_INSSI = CAD_ESPECIE_INSS1.CODIGO
        Left Join GENERO On AGG_FILIACAO.SEXO = GENERO.GENERO
        Left Join CARGO On AGG_FILIACAO.CARGO_ORGAO = CARGO.CODIGO
        Left Join CARGO CARGO1 On AGG_FILIACAO.CARGO_ORGAOI = CARGO1.CODIGO
      Where
        AGG_FILIACAO.PROTOCOLO = @PROTOCOLO
        And (@CPF = '' Or AGG_FILIACAO.CPF = @CPF)
      `,
      {
        PROTOCOLO: protocoloKey,
        CPF: cpfDigits
      }
    );

    if (rows.length === 0) {
      throw new BadRequestException("Protocolo não encontrado para este CPF.");
    }

    const sindicatoRows = await this.legacyDatabaseService.query<ProtocoloRelatorioSindicatoRow>(
      `
      Select Top 1
        SINDICATO.CNPJ,
        SINDICATO.RAZAO_SOCIAL,
        SINDICATO.FANTASIA,
        SINDICATO.LOGO,
        SINDICATO.TEXTO_AUTORIZACAO_DESCONTO
      From
        SINDICATO
      `
    );

    const row = rows[0];
    const sindicato = sindicatoRows[0];

    return {
      generatedAt: new Date().toISOString(),
      detalhe: {
        protocolo: this.normalizeScalar(row.PROTOCOLO),
        nrProtocolo: this.normalizeScalar(row.NRPROTOCOLO),
        cpf: this.normalizeScalar(row.CPFAGGFILIACAO),
        nome: this.normalizeScalar(row.NOME),
        nomeSocial: this.normalizeScalar(row.NOME_SOCIAL),
        especificarGenero: this.normalizeScalar(row.ESPECIFICAR_GENERO),
        orientacaoSexual: this.normalizeScalar(row.ORIENTACAO_SEXUAL),
        sexoMaiusculo: this.normalizeScalar(row.SEXOMAIUSCULO),
        pai: this.normalizeScalar(row.PAI),
        mae: this.normalizeScalar(row.MAE),
        naturalidade: this.normalizeScalar(row.NATURALIDADE),
        rgOculto: this.normalizeScalar(row.RGOCULTO),
        dataExpRg: this.toDateTimeIso(row.DATAEXPRG),
        rgOrgao: this.normalizeScalar(row.RG_ORGAO),
        rgUf: this.normalizeScalar(row.RG_UF),
        cep: this.normalizeScalar(row.CEP),
        endereco: this.normalizeScalar(row.ENDERECO),
        numero: this.normalizeScalar(row.NUMERO),
        complemento: this.normalizeScalar(row.COMPLEMENTO),
        bairro: this.normalizeScalar(row.BAIRRO),
        cidade: this.normalizeScalar(row.CIDADE),
        estado: this.normalizeScalar(row.ESTADO),
        telefone: this.normalizeScalar(row.TELEFONE),
        celular: this.normalizeScalar(row.CELULAR),
        celularIi: this.normalizeScalar(row.CELULARII),
        dataNascimento: this.toDateTimeIso(row.DATANASCIMENTO),
        emailMaiusculo: this.normalizeScalar(row.EMAILMAIUSCULO),
        estadoCivil: this.normalizeScalar(row.ESTADOCIVIL),
        dataRegistro: this.toDateTimeIso(row.DATA_REGISTRO),
        matriculaOrgao: this.normalizeScalar(row.MATRICULA_ORGAO),
        cargaHorariaOrgao: this.normalizeScalar(row.CARGAHORARIA_ORGAO),
        admissaoOrgao: this.toDateTimeIso(row.ADMISSAO_ORGAO),
        aposentadoriaOrgao: this.toDateTimeIso(row.APOSENTADORIA_ORGAO),
        entePublico: this.normalizeScalar(row.ENTEPUBLICO),
        codigoEmpresa: this.normalizeScalar(row.CODIGO_EMPRESA),
        codigoPredio: this.normalizeScalar(row.CODIGO_PREDIO),
        situacaoFiliacao: this.normalizeScalar(row.SITUACAO_FILIACAO),
        situacaoFuncional: this.normalizeScalar(row.SITUACAO_FUNCIONAL),
        funcaoOrgao: this.normalizeScalar(row.FUNCAO_ORGAO),
        cargoOrgao: this.normalizeScalar(row.CARGO),
        nivelOrgao: this.normalizeScalar(row.NIVEL_ORGAO),
        profissaoOrgao: this.normalizeScalar(row.PROFISSAO_ORGAO),
        vinculoEmpregaticioOrgao: this.normalizeScalar(row.VINCULO_EMPREGATICIO_ORGAO),
        matriculaOrgaoI: this.normalizeScalar(row.MATRICULA_ORGAOI),
        admissaoOrgaoI: this.toDateTimeIso(row.ADMISSAO_ORGAOI),
        aposentadoriaOrgaoI: this.toDateTimeIso(row.APOSENTADORIA_ORGAOI),
        entePublicoI: this.normalizeScalar(row.ENTEPUBLICOI),
        codigoEmpresaI: this.normalizeScalar(row.CODIGO_EMPRESAI),
        codigoPredioI: this.normalizeScalar(row.CODIGO_PREDIOI),
        situacaoOrgaoI: this.normalizeScalar(row.SITUACAO_ORGAO),
        funcaoOrgaoI: this.normalizeScalar(row.FUNCAO_ORGAO_I),
        cargoOrgaoI: this.normalizeScalar(row.CARGO1),
        nivelOrgaoI: this.normalizeScalar(row.NIVEL_ORGAO_I),
        profissaoOrgaoI: this.normalizeScalar(row.PROFISSAO_ORGAO_I),
        vinculoEmpregaticioOrgaoI: this.normalizeScalar(row.VINCULO_EMPREGATICIO_ORGAO_I),
        autorizarDesconto: this.normalizeScalar(row.AUTORIZARDESCONTO),
        termoLgpdConfirmacao: this.normalizeScalar(row.TERMOLGPD),
        termoLgpdTexto: this.normalizeScalar(row.TEXTO_LGPD),
        dataDescontoInss: this.toDateTimeIso(row.DATA_DESCONTO_INSS),
        numeroBeneficioInss: this.normalizeScalar(row.NUMERO_BENEFICIO_INSS),
        dataDescontoInssI: this.toDateTimeIso(row.DATA_DESCONTO_INSSI),
        numeroBeneficioInssI: this.normalizeScalar(row.NUMERO_BENEFICIO_INSSI),
        especieInss: this.normalizeScalar(row.ESPECIE_INSS),
        especieInssI: this.normalizeScalar(row.ESPECIE_INSS_I),
        descontarInssMaiusculo: this.normalizeScalar(row.DESCONTAR_INSSMAIUSCULO),
        descontarInssIMaiusculo: this.normalizeScalar(row.DESCONTAR_INSSIMAIUSCULO),
        foto: this.toFotoDataUrl(row.FOTO),
        fotoResidencia: this.toFotoDataUrl(row.FOTO_RESIDENCIA),
        fotoContracheque01: this.toFotoDataUrl(row.FOTO_CONTRACHEQUE01),
        fotoContracheque02: this.toFotoDataUrl(row.FOTO_CONTRACHEQUE02),
        fotoRgFrente: this.toFotoDataUrl(row.FOTO_RG_FRENTE),
        fotoRgVerso: this.toFotoDataUrl(row.FOTO_RG_VERSO),
        fotoDocumento: this.toFotoDataUrl(row.FOTO_DOCUMENTO),
        ip: this.normalizeScalar(row.IP)
      },
      sindicato: sindicato
        ? {
            cnpj: this.normalizeScalar(sindicato.CNPJ),
            razaoSocial: this.normalizeScalar(sindicato.RAZAO_SOCIAL),
            fantasia: this.normalizeScalar(sindicato.FANTASIA),
            logoImg: this.toFotoDataUrl(sindicato.LOGO),
            textoAutorizacaoDesconto: this.normalizeScalar(sindicato.TEXTO_AUTORIZACAO_DESCONTO)
          }
        : null
    };
  }

  async getFichaCadastralByCpf(cpf?: string, usuario?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");
    const usuarioPermissao = (usuario ?? cpfDigits).trim();

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const pessoaRows = await this.legacyDatabaseService.query<FichaCadastralPessoaRow>(
      `
      With
        UsuarioPermissao As (
          Select Top 1
            USUARIO_PERMISSAO.USUARIO,
            IsNull(USUARIO_PERMISSAO.ANONIMIZAR_CPF, 0) As anonimizar
          From
            USUARIO_PERMISSAO
          Where
            USUARIO_PERMISSAO.USUARIO = @USUARIO
        )
      Select Top 1
        dbo.cpf_anonimizar(PESSOAS.CPF, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As CPFOCULTO,
        dbo.AnonimizaNome(IsNull(PESSOAS.NOME_SOCIAL, PESSOAS.NOME), IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As NOME,
        dbo.AnonimizaNome(PESSOAS.PAI, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As PAI,
        dbo.AnonimizaNome(PESSOAS.MAE, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As MAE,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else PESSOAS.NATURALIDADE
        End As NATURALIDADE,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else PESSOAS.NACIONALIDADE
        End As NACIONALIDADE,
        dbo.RG_ANONIMIZAR(PESSOAS.RG, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As RGOCULTO,
        dbo.OcultarData(PESSOAS.DATAEXPRG, PESSOAS.ANONIMIZAR) As DATAEXPRG,
        dbo.TITULO_ELEITOR_ANONIMIZA(PESSOAS.TITULOELEITOR, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As TITULOELEITOR,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else PESSOAS.SEXO
        End As SEXO,
        dbo.AnonimizaNome(PESSOAS.ENDERECO, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As ENDERECO,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else PESSOAS.BAIRRO
        End As BAIRRO,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else PESSOAS.CIDADE
        End As CIDADE,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else PESSOAS.ESTADO
        End As ESTADO,
        dbo.cep_anonimizar(PESSOAS.CEP, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As CEP,
        dbo.TELEFONE_ANONIMIZAR(PESSOAS.TELEFONE, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As TELEFONE,
        dbo.TELEFONE_ANONIMIZAR(PESSOAS.CELULAR, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As CELULAR,
        dbo.DATA_NASCIMENTO_ANONIMIZA(PESSOAS.DATANASCIMENTO, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As DATANASCIMENTO,
        PESSOAS.DATAEMISCARTEIRA,
        PESSOAS.DATAVALCARTEIRA,
        Case
          When PESSOAS.AUTORIZAEMAIL = 0 Then 'Não'
          Else 'Sim'
        End As AUTORIZAEMAIL,
        dbo.EMAIL_ANONIMIZAR(PESSOAS.EMAIL, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As EMAIL,
        dbo.DATA_NASCIMENTO_ANONIMIZA(PESSOAS.DATAINCLUSAO, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As DATAINCLUSAO,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else dbo.idadeextenso(IsNull(PESSOAS.DATANASCIMENTO, GetDate()), GetDate())
        End As NASCIMENTO_EXTENSO,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else ESTADOCIVIL.DESCRICAO
        End As DESCRICAO,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else GRAU_INSTRUCAO.DESCRICAO
        End As INSTRUCAO,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else PESSOAS.COMPLEMENTO
        End As COMPLEMENTO,
        Case
          When IsNull(UsuarioPermissao.anonimizar, 0) = 1 Or IsNull(PESSOAS.ANONIMIZAR, 0) = 1 Then 'Null'
          Else RACA.DESCRICAO
        End As DESCRACA,
        PESSOAS.NUMERO,
        PESSOAS.QRCODE_FICHA,
        PESSOAS.FOTO_IMG As FOTOIMG
      From
        PESSOAS
        Left Join ESTADOCIVIL On PESSOAS.ESTADOCIVIL = ESTADOCIVIL.CODIGO
        Left Join GRAU_INSTRUCAO On PESSOAS.GRAUINSTRUCAO = GRAU_INSTRUCAO.CODIGO
        Left Join RACA On PESSOAS.RACA = RACA.CODIGO
        Left Join UsuarioPermissao On 1 = 1
      Where
        PESSOAS.CPF = @CPF
        And (PESSOAS.BLOQ_DADOS <> 1 Or PESSOAS.BLOQ_DADOS Is Null)
      Order By
        dbo.AnonimizaNome(IsNull(PESSOAS.NOME_SOCIAL, PESSOAS.NOME), IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0))
      `,
      {
        CPF: cpfDigits,
        USUARIO: usuarioPermissao
      }
    );

    if (pessoaRows.length === 0) {
      throw new BadRequestException("Não foi possível gerar a ficha cadastral para o CPF informado.");
    }

    const filiacoesRows = await this.legacyDatabaseService.query<FichaCadastralFiliacaoRow>(
      `
      Select
        SITUACAO_FILIADO.DESCRICAO As SITUACAO,
        FILIADO.MATRICULA,
        Cast(FILIADO.CODIGO_EMPRESA As VarChar(20)) + ' - ' + IsNull(EMPRESA.DESCRICAO, '') As DESCEMPRESA,
        Cast(FILIADO.CODIGO_PREDIO As VarChar(20)) + ' - ' + IsNull(PREDIO.DESCRICAO, '') As DESCPREDIO,
        Case
          When FILIADO.ASSOCIADO = -1 Then 'Sim'
          Else 'Não'
        End As FILIADO,
        FILIADO.DATASINDICALIZACAO,
        FILIADO.DATADESFILIACAO
      From
        FILIADO
        Inner Join EMPRESA On FILIADO.CODIGO_EMPRESA = EMPRESA.CODIGO
        Inner Join PREDIO On FILIADO.CODIGO_EMPRESA = PREDIO.CODIGO_EMPRESA
          And FILIADO.CODIGO_PREDIO = PREDIO.CODIGO
        Inner Join SITUACAO_FILIADO On FILIADO.SITUACAO = SITUACAO_FILIADO.CODIGO
      Where
        FILIADO.CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    const dependentesRows = await this.legacyDatabaseService.query<FichaCadastralDependenteRow>(
      `
      With
        UsuarioPermissao As (
          Select Top 1
            USUARIO_PERMISSAO.USUARIO,
            IsNull(USUARIO_PERMISSAO.ANONIMIZAR_CPF, 0) As anonimizar
          From
            USUARIO_PERMISSAO
          Where
            USUARIO_PERMISSAO.USUARIO = @USUARIO
        )
      Select
        dbo.AnonimizaNome(DEPENDENTES.NOME, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As NOME,
        DEPENDENTES.SEXO,
        dbo.DATA_NASCIMENTO_ANONIMIZA(DEPENDENTES.DATANASCIMENTO, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As DATANASCIMENTO,
        GRAU_PARENTESCO.DESCRICAO,
        dbo.cpf_anonimizar(DEPENDENTES.CPF, IsNull(UsuarioPermissao.anonimizar, 0) | IsNull(PESSOAS.ANONIMIZAR, 0)) As CPFDEPENDENTE,
        PESSOAS.CPF
      From
        DEPENDENTES
        Inner Join GRAU_PARENTESCO On DEPENDENTES.GRAUPARENTESCO = GRAU_PARENTESCO.CODIGO
        Inner Join PESSOAS On DEPENDENTES.CPF = PESSOAS.CPF
        Left Join UsuarioPermissao On 1 = 1
      Where
        PESSOAS.CPF = @CPF
      `,
      {
        CPF: cpfDigits,
        USUARIO: usuarioPermissao
      }
    );

    const sindicatoRows = await this.legacyDatabaseService.query<FichaCadastralSindicatoRow>(
      `
      Select Top 1
        SINDICATO.CNPJ,
        SINDICATO.RAZAO_SOCIAL,
        SINDICATO.FANTASIA,
        SINDICATO.LOGO
      From
        SINDICATO
      `
    );

    const pessoa = pessoaRows[0];
    const sindicato = sindicatoRows[0];
    const qrCodeFicha = await this.ensureFichaQrCode(cpfDigits, pessoa.QRCODE_FICHA);

    return {
      cpf: this.maskCpf(cpfDigits),
      usuario: usuarioPermissao,
      generatedAt: new Date().toISOString(),
      pessoa: {
        cpfOculto: this.normalizeScalar(pessoa.CPFOCULTO),
        nome: this.normalizeScalar(pessoa.NOME),
        pai: this.normalizeScalar(pessoa.PAI),
        mae: this.normalizeScalar(pessoa.MAE),
        naturalidade: this.normalizeScalar(pessoa.NATURALIDADE),
        nacionalidade: this.normalizeScalar(pessoa.NACIONALIDADE),
        rgOculto: this.normalizeScalar(pessoa.RGOCULTO),
        dataExpRg: this.toDateTimeIso(pessoa.DATAEXPRG),
        tituloEleitor: this.normalizeScalar(pessoa.TITULOELEITOR),
        sexo: this.normalizeScalar(pessoa.SEXO),
        endereco: this.normalizeScalar(pessoa.ENDERECO),
        bairro: this.normalizeScalar(pessoa.BAIRRO),
        cidade: this.normalizeScalar(pessoa.CIDADE),
        estado: this.normalizeScalar(pessoa.ESTADO),
        cep: this.normalizeScalar(pessoa.CEP),
        telefone: this.normalizeScalar(pessoa.TELEFONE),
        celular: this.normalizeScalar(pessoa.CELULAR),
        dataNascimento: this.toDateTimeIso(pessoa.DATANASCIMENTO),
        dataEmisCarteira: this.toDateTimeIso(pessoa.DATAEMISCARTEIRA),
        dataValCarteira: this.toDateTimeIso(pessoa.DATAVALCARTEIRA),
        autorizaEmail: this.normalizeScalar(pessoa.AUTORIZAEMAIL),
        email: this.normalizeScalar(pessoa.EMAIL),
        dataInclusao: this.toDateTimeIso(pessoa.DATAINCLUSAO),
        nascimentoExtenso: this.normalizeScalar(pessoa.NASCIMENTO_EXTENSO),
        estadoCivilDescricao: this.normalizeScalar(pessoa.DESCRICAO),
        instrucao: this.normalizeScalar(pessoa.INSTRUCAO),
        complemento: this.normalizeScalar(pessoa.COMPLEMENTO),
        racaDescricao: this.normalizeScalar(pessoa.DESCRACA),
        numero: this.normalizeScalar(pessoa.NUMERO),
        qrCodeFicha,
        fotoImg: this.toFotoDataUrl(pessoa.FOTOIMG)
      },
      filiacoes: filiacoesRows.map((row) => ({
        situacao: this.normalizeScalar(row.SITUACAO),
        matricula: this.normalizeScalar(row.MATRICULA),
        descEmpresa: this.normalizeScalar(row.DESCEMPRESA),
        descPredio: this.normalizeScalar(row.DESCPREDIO),
        filiado: this.normalizeScalar(row.FILIADO),
        dataSindicalizacao: this.toDateTimeIso(row.DATASINDICALIZACAO),
        dataDesfiliacao: this.toDateTimeIso(row.DATADESFILIACAO)
      })),
      dependentes: dependentesRows.map((row) => ({
        nome: this.normalizeScalar(row.NOME),
        sexo: this.normalizeScalar(row.SEXO),
        dataNascimento: this.toDateTimeIso(row.DATANASCIMENTO),
        parentesco: this.normalizeScalar(row.DESCRICAO),
        cpfDependente: this.normalizeScalar(row.CPFDEPENDENTE)
      })),
      sindicato: sindicato
        ? {
            cnpj: this.normalizeScalar(sindicato.CNPJ),
            razaoSocial: this.normalizeScalar(sindicato.RAZAO_SOCIAL),
            fantasia: this.normalizeScalar(sindicato.FANTASIA),
            logoImg: this.toFotoDataUrl(sindicato.LOGO)
          }
        : null
    };
  }

  async prepareCarteiraByCpf(cpf?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    try {
      const anoValidadeCol = await this.resolveFirstExistingColumn("SINDICATO", ["ANO_VALIDADE_CARTEIRA"]);
      const emiteCarteiraCol = await this.resolveFirstExistingColumn("SINDICATO", ["EMITE_CARTEIRA"]);

      const dataValidadeCol = await this.resolveFirstExistingColumn("PESSOAS", ["DATAVALCARTEIRA", "DATAVALIDADECARTEIRA"]);
      const dataEmissaoCol = await this.resolveFirstExistingColumn("PESSOAS", ["DATAEMISCARTEIRA"]);
      const qrCarteiraCol = await this.resolveFirstExistingColumn("PESSOAS", ["QRCODE_CARTEIRA", "QRCODECARTEIRA"]);

      const sindicatoRows = await this.legacyDatabaseService.query<SindicatoCarteiraRow>(
        `
        Select Top 1
          ${anoValidadeCol ? `IsNull(SINDICATO.${anoValidadeCol}, 2)` : "2"} As ANO_VALIDADE_CARTEIRA,
          ${emiteCarteiraCol ? `SINDICATO.${emiteCarteiraCol}` : "1"} As EMITE_CARTEIRA,
          SINDICATO.URL,
          SINDICATO.IMG_CART_F_M,
          SINDICATO.IMG_CART_V_M
        From
          SINDICATO
        `
      );

      if (sindicatoRows.length === 0) {
        throw new BadRequestException("Configuração da carteira não encontrada.");
      }

      const sindicato = sindicatoRows[0];
      const sindicatoUrl = this.normalizeScalar(sindicato.URL);
      if (!sindicatoUrl) {
        throw new BadRequestException("URL base da carteira não configurada.");
      }

      const anoValidade = this.resolveAnoValidadeCarteira(sindicato.ANO_VALIDADE_CARTEIRA);

      const pessoaRows = await this.legacyDatabaseService.query<PessoaCarteiraRow>(
        `
        Select Top 1
          PESSOAS.CPF,
          IsNull(PESSOAS.NOME_SOCIAL, PESSOAS.NOME) As NOME,
          PESSOAS.NOME_SOCIAL,
          ${dataValidadeCol ? `PESSOAS.${dataValidadeCol}` : "Cast(Null As DateTime)"} As DATAVALCARTEIRA,
          ${dataEmissaoCol ? `PESSOAS.${dataEmissaoCol}` : "Cast(Null As DateTime)"} As DATAEMISCARTEIRA,
          PESSOAS.SANGUE_TP_RH,
          'CPF: ' + dbo.formatar_cpfcnpj(PESSOAS.CPF) As CPF_EXTENSO,
          IsNull(PESSOAS.CIDADE_CARTEIRINHA, PESSOAS.CIDADE) As CIDADE_CARTEIRINHA,
          PESSOAS.FOTO_IMG,
          PESSOAS.ID_PESSOA,
          ${qrCarteiraCol ? `PESSOAS.${qrCarteiraCol}` : "Cast(Null As VarChar(Max))"} As QRCODE_CARTEIRA
        From
          PESSOAS
        Where
          PESSOAS.CPF = @CPF
        `,
        { CPF: cpfDigits }
      );

      if (pessoaRows.length === 0) {
        throw new BadRequestException("Pessoa não encontrada para o CPF informado.");
      }

      const pessoa = pessoaRows[0];
      const carteiraUrl = this.buildLegacyCarteiraUrl(sindicatoUrl, cpfDigits);

      let qrCodeCarteira = this.toQrCodeDataUrl(pessoa.QRCODE_CARTEIRA);
      let qrCodeFoiGerado = false;

      if (!qrCodeCarteira) {
        qrCodeCarteira = await QRCode.toDataURL(carteiraUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 220
        });
        qrCodeFoiGerado = true;
      }

      const qrCodeCarteiraBuffer = this.parseFotoFromDataUrl(qrCodeCarteira);

      const hoje = this.toDateStart(new Date());
      const dataValidadeAtual = pessoa.DATAVALCARTEIRA ? new Date(pessoa.DATAVALCARTEIRA) : null;
      const carteiraVencida =
        !dataValidadeAtual ||
        Number.isNaN(dataValidadeAtual.getTime()) ||
        this.toDateStart(dataValidadeAtual) < hoje;

      const dataEmissaoNova = new Date(hoje);
      const dataValidadeNova = new Date(hoje);
      dataValidadeNova.setFullYear(dataValidadeNova.getFullYear() + anoValidade);

      const updateSetClauses: string[] = [];

      if (qrCarteiraCol && qrCodeFoiGerado) {
        updateSetClauses.push(`${qrCarteiraCol} = @QRCODE_CARTEIRA`);
      }

      if (dataEmissaoCol) {
        updateSetClauses.push(
          `${dataEmissaoCol} = Case When @ATUALIZA_VALIDADE = 1 Then @DATAEMISCARTEIRA Else ${dataEmissaoCol} End`
        );
      }

      if (dataValidadeCol) {
        updateSetClauses.push(
          `${dataValidadeCol} = Case When @ATUALIZA_VALIDADE = 1 Then @DATAVALCARTEIRA Else ${dataValidadeCol} End`
        );
      }

      if (updateSetClauses.length > 0) {
        await this.legacyDatabaseService.query(
          `
          Update PESSOAS
          Set
            ${updateSetClauses.join(",\n            ")}
          Where
            CPF = @CPF
          `,
          {
            CPF: cpfDigits,
            QRCODE_CARTEIRA: qrCodeCarteiraBuffer,
            ATUALIZA_VALIDADE: carteiraVencida ? 1 : 0,
            DATAEMISCARTEIRA: dataEmissaoNova,
            DATAVALCARTEIRA: dataValidadeNova
          }
        );
      }

      return {
        cpf: this.maskCpf(cpfDigits),
        url: carteiraUrl,
        qrCodeCarteira,
        qrCodeFoiGerado,
        carteiraVencida,
        dataEmissaoCarteira: carteiraVencida ? dataEmissaoNova.toISOString() : this.toDateTimeIso(pessoa.DATAEMISCARTEIRA),
        dataValidadeCarteira: carteiraVencida ? dataValidadeNova.toISOString() : this.toDateTimeIso(pessoa.DATAVALCARTEIRA),
        anosValidadeCarteira: anoValidade,
        nome: this.normalizeScalar(pessoa.NOME),
        cpfExtenso: this.normalizeScalar(pessoa.CPF_EXTENSO),
        cidadeCarteirinha: this.normalizeScalar(pessoa.CIDADE_CARTEIRINHA),
        sangueTpRh: this.normalizeScalar(pessoa.SANGUE_TP_RH),
        fotoImg: this.toFotoDataUrl(pessoa.FOTO_IMG),
        sindicato: {
          imgCartFrente: this.toFotoDataUrl(sindicato.IMG_CART_F_M),
          imgCartVerso: this.toFotoDataUrl(sindicato.IMG_CART_V_M)
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const detail = error instanceof Error ? error.message : "Falha desconhecida ao preparar carteira.";
      this.logger.error(`Erro ao preparar carteira para CPF ${cpfDigits}: ${detail}`);
      throw new BadRequestException(`Falha ao preparar carteira: ${detail}`);
    }
  }

  async getAtualizarDadosByCpf(cpf?: string) {
    const cpfDigits = this.sanitizeCpf(cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const rows = await this.legacyDatabaseService.query<AtualizarDadosPessoaRow>(
      `
      Select Top 1
        PESSOAS.CPF,
        PESSOAS.NOME,
        PESSOAS.FOTO_IMG,
        PESSOAS.PAI,
        PESSOAS.MAE,
        PESSOAS.NATURALIDADE,
        PESSOAS.UFNATURALIDADE,
        PESSOAS.NACIONALIDADE,
        PESSOAS.FATOR_HR,
        PESSOAS.RG,
        PESSOAS.RG_ORGAO,
        PESSOAS.RG_UF,
        PESSOAS.DATAEXPRG,
        PESSOAS.TITULOELEITOR,
        PESSOAS.SEXO,
        PESSOAS.ESTADOCIVIL,
        PESSOAS.TELEFONE,
        PESSOAS.CELULAR,
        PESSOAS.DATANASCIMENTO,
        PESSOAS.GRAUINSTRUCAO,
        PESSOAS.CARTPROFISSIONAL,
        PESSOAS.EMAIL,
        PESSOAS.RACA,
        PESSOAS.SANGUE_TP_RH,
        PESSOAS.CELULARII,
        PESSOAS.ENDERECO_ACR,
        PESSOAS.COMPLEMENTO_ACR,
        PESSOAS.BAIRRO_ACR,
        PESSOAS.CIDADE_ACR,
        PESSOAS.ESTADO_ACR,
        PESSOAS.CEP_ACR,
        PESSOAS.NUMERO_ACR,
        PESSOAS.ID_PESSOA,
        PESSOAS.NOME_SOCIAL,
        PESSOAS.ESPECIFICAR_GENERO,
        PESSOAS.ORIENTACAO_SEXUAL
      From
        PESSOAS
      Where
        PESSOAS.CPF = @CPF
      Order By
        Case
          When NullIf(LTrim(RTrim(IsNull(PESSOAS.ESTADOCIVIL, ''))), '') Is Null Then 1
          Else 0
        End,
        IsNull(PESSOAS.ID_PESSOA, 0) Desc
      `,
      { CPF: cpfDigits }
    );

    if (rows.length === 0) {
      throw new BadRequestException("Pessoa não encontrada para o CPF informado.");
    }

    const row = rows[0];
    const estadoCivilResolved = await this.resolveEstadoCivil(cpfDigits, row.ESTADOCIVIL);

    return {
      cpf: this.maskCpf(cpfDigits),
      nome: row.NOME?.trim() ?? "",
      fotoPerfilUrl: this.toFotoDataUrl(row.FOTO_IMG),
      pai: row.PAI?.trim() ?? "",
      mae: row.MAE?.trim() ?? "",
      naturalidade: row.NATURALIDADE?.trim() ?? "",
      ufNaturalidade: row.UFNATURALIDADE?.trim() ?? "",
      nacionalidade: row.NACIONALIDADE?.trim() ?? "",
      fatorHr: row.FATOR_HR?.trim() ?? "",
      rg: row.RG?.trim() ?? "",
      rgOrgao: row.RG_ORGAO?.trim() ?? "",
      rgUf: row.RG_UF?.trim() ?? "",
      dataExpRg: this.toDateIso(row.DATAEXPRG),
      tituloEleitor: row.TITULOELEITOR?.trim() ?? "",
      sexo: row.SEXO?.trim() ?? "",
      estadoCivil: estadoCivilResolved,
      telefone: row.TELEFONE?.trim() ?? "",
      celular: row.CELULAR?.trim() ?? "",
      dataNascimento: this.toDateIso(row.DATANASCIMENTO),
      grauInstrucao: row.GRAUINSTRUCAO?.trim() ?? "",
      cartProfissional: row.CARTPROFISSIONAL?.trim() ?? "",
      email: row.EMAIL?.trim() ?? "",
      raca: row.RACA?.trim() ?? "",
      sangueTpRh: row.SANGUE_TP_RH?.trim() ?? "",
      celularIi: row.CELULARII?.trim() ?? "",
      enderecoAcr: row.ENDERECO_ACR?.trim() ?? "",
      complementoAcr: row.COMPLEMENTO_ACR?.trim() ?? "",
      bairroAcr: row.BAIRRO_ACR?.trim() ?? "",
      cidadeAcr: row.CIDADE_ACR?.trim() ?? "",
      estadoAcr: row.ESTADO_ACR?.trim() ?? "",
      cepAcr: row.CEP_ACR?.trim() ?? "",
      numeroAcr: row.NUMERO_ACR?.trim() ?? "",
      idPessoa: String(row.ID_PESSOA ?? "").trim(),
      nomeSocial: row.NOME_SOCIAL?.trim() ?? "",
      especificarGenero: row.ESPECIFICAR_GENERO?.trim() ?? "",
      orientacaoSexual: row.ORIENTACAO_SEXUAL?.trim() ?? ""
    };
  }

  async getLookupUfs() {
    const rows = await this.legacyDatabaseService.query<LookupUfRow>(
      `
      Select
        Cast(GLO_UF.UF As VarChar(2)) As estado
      From
        GLO_UF
      Order By
        GLO_UF.UF
      `
    );

    return rows.map((row) => ({
      value: row.estado?.trim() ?? "",
      label: row.estado?.trim() ?? ""
    }));
  }

  async getLookupGeneros() {
    const rows = await this.legacyDatabaseService.query<LookupGeneroRow>(
      `
      Select
        GENERO.GENERO,
        GENERO.DESCRICAO
      From
        GENERO
      Order By
        GENERO.DESCRICAO
      `
    );

    return rows.map((row) => ({
      value: row.GENERO?.trim() ?? "",
      label: row.DESCRICAO?.trim() ?? ""
    }));
  }

  async getLookupEstadosCivis() {
    const rows = await this.legacyDatabaseService.query<LookupEstadoCivilRow>(
      `
      Select
        ESTADOCIVIL.CODIGO,
        ESTADOCIVIL.DESCRICAO
      From
        ESTADOCIVIL
      `
    );

    return rows.map((row) => ({
      value: String(row.CODIGO ?? "").trim(),
      label: row.DESCRICAO?.trim() ?? ""
    }));
  }

  async getLookupRacas() {
    const rows = await this.legacyDatabaseService.query<LookupRacaRow>(
      `
      Select
        RACA.CODIGO,
        RACA.DESCRICAO
      From
        RACA
      Order By
        RACA.CODIGO
      `
    );

    return rows.map((row) => ({
      value: String(row.CODIGO ?? "").trim(),
      label: row.DESCRICAO?.trim() ?? ""
    }));
  }

  async getLookupCidades(uf?: string) {
    const ufClean = (uf ?? "").trim().toUpperCase();

    const rows = await this.legacyDatabaseService.query<LookupCidadeRow>(
      `
      Select
        GLO_CIDADE.CIDADE,
        GLO_CIDADE.UF
      From
        GLO_CIDADE
        Inner Join
        GLO_UF On GLO_CIDADE.UF = GLO_UF.UF
      Where
        (@UF = '' Or GLO_CIDADE.UF = @UF)
      Order By
        GLO_CIDADE.CIDADE
      `,
      { UF: ufClean }
    );

    return rows.map((row) => ({
      value: row.CIDADE?.trim() ?? "",
      label: row.CIDADE?.trim() ?? "",
      uf: row.UF?.trim() ?? ""
    }));
  }

  getLookupFatoresSanguineos() {
    const options = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    return options.map((item) => ({
      value: item,
      label: item
    }));
  }

  async updateAtualizarDados(payload: UpdateUserDataDto) {
    const cpfDigits = this.sanitizeCpf(payload.cpf ?? "");

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const requiredFields = [
      { key: "nome", label: "Nome Completo" },
      { key: "enderecoAcr", label: "Endereço" },
      { key: "numeroAcr", label: "Número" },
      { key: "bairroAcr", label: "Bairro" },
      { key: "estadoAcr", label: "UF" },
      { key: "cidadeAcr", label: "Cidade" }
    ] as const;

    for (const field of requiredFields) {
      const rawValue = payload[field.key];
      if (!rawValue || rawValue.trim().length === 0) {
        throw new BadRequestException(`O campo ${field.label} é obrigatório.`);
      }
    }

    const snapshotRows = await this.legacyDatabaseService.query<PessoaUpdateSnapshotRow>(
      `
      Select Top 1
        CPF,
        ENDERECO_ACR,
        COMPLEMENTO_ACR,
        BAIRRO_ACR,
        CIDADE_ACR,
        ESTADO_ACR,
        CEP_ACR,
        NUMERO_ACR,
        ENDERECO_ALTEROU,
        SOLICITOU_ALT_ENDE
      From
        PESSOAS
      Where
        CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (snapshotRows.length === 0) {
      throw new BadRequestException("Pessoa não encontrada para o CPF informado.");
    }

    const current = snapshotRows[0];
    const fotoFoiInformada = typeof payload.fotoPerfilBase64 === "string";
    const fotoBuffer = fotoFoiInformada ? this.parseFotoFromDataUrl(payload.fotoPerfilBase64 ?? "") : null;

    const enderecoAcr = this.normalizeOptionalText(payload.enderecoAcr);
    const complementoAcr = this.normalizeOptionalText(payload.complementoAcr);
    const bairroAcr = this.normalizeOptionalText(payload.bairroAcr);
    const cidadeAcr = this.normalizeOptionalText(payload.cidadeAcr);
    const estadoAcr = this.normalizeOptionalText(payload.estadoAcr)?.toUpperCase() ?? null;
    const cepAcr = this.normalizeCep(payload.cepAcr);
    const numeroAcr = this.normalizeOptionalText(payload.numeroAcr);
    const normalize = (value?: string | null) => (value ?? "").trim();
    const enderecoFoiAlterado =
      normalize(current.ENDERECO_ACR) !== normalize(enderecoAcr) ||
      normalize(current.COMPLEMENTO_ACR) !== normalize(complementoAcr) ||
      normalize(current.BAIRRO_ACR) !== normalize(bairroAcr) ||
      normalize(current.CIDADE_ACR) !== normalize(cidadeAcr) ||
      normalize(current.ESTADO_ACR) !== normalize(estadoAcr) ||
      normalize(current.CEP_ACR) !== normalize(cepAcr) ||
      normalize(current.NUMERO_ACR) !== normalize(numeroAcr);

    const possuiSolicitacaoEnderecoPendente =
      this.isFlagEnabled(current.ENDERECO_ALTEROU) || this.isFlagEnabled(current.SOLICITOU_ALT_ENDE);

    if (
      enderecoFoiAlterado &&
      possuiSolicitacaoEnderecoPendente &&
      payload.confirmarSubstituicaoSolicitacaoEndereco !== true
    ) {
      throw new ConflictException({
        code: "ENDERECO_SOLICITACAO_PENDENTE",
        message:
          "Já existe uma solicitação de alteração de endereço em análise. Deseja substituir a solicitação atual por esta nova? O prazo de análise será reiniciado."
      });
    }

    await this.legacyDatabaseService.query(
      `
      Update PESSOAS
      Set
        NOME = @NOME,
        PAI = @PAI,
        MAE = @MAE,
        FATOR_HR = @SANGUE_TP_RH,
        RG = @RG,
        RG_ORGAO = @RG_ORGAO,
        RG_UF = @RG_UF,
        DATAEXPRG = @DATAEXPRG,
        SEXO = @SEXO,
        ESTADOCIVIL = @ESTADOCIVIL,
        TELEFONE = @TELEFONE,
        CELULAR = @CELULAR,
        DATANASCIMENTO = @DATANASCIMENTO,
        RACA = @RACA,
        SANGUE_TP_RH = @SANGUE_TP_RH,
        CELULARII = @CELULARII,
        ENDERECO_ACR = @ENDERECO_ACR,
        COMPLEMENTO_ACR = @COMPLEMENTO_ACR,
        BAIRRO_ACR = @BAIRRO_ACR,
        CIDADE_ACR = @CIDADE_ACR,
        ESTADO_ACR = @ESTADO_ACR,
        CEP_ACR = @CEP_ACR,
        NUMERO_ACR = @NUMERO_ACR,
        ENDERECO_ALTEROU = Case
          When @ENDERECO_ALTERADO_SET = 1 Then 1
          Else ENDERECO_ALTEROU
        End,
        SOLICITOU_ALT_ENDE = Case
          When @ENDERECO_ALTERADO_SET = 1 Then 1
          Else SOLICITOU_ALT_ENDE
        End,
        NOME_SOCIAL = @NOME_SOCIAL,
        ESPECIFICAR_GENERO = @ESPECIFICAR_GENERO,
        ORIENTACAO_SEXUAL = @ORIENTACAO_SEXUAL,
        FOTO_IMG = Case
          When @FOTO_IMG_SET = 1 Then Cast(@FOTO_IMG As VarBinary(Max))
          Else FOTO_IMG
        End
      Where
        CPF = @CPF
      `,
      {
        CPF: cpfDigits,
        NOME: this.normalizeOptionalText(payload.nome),
        PAI: this.normalizeOptionalText(payload.pai),
        MAE: this.normalizeOptionalText(payload.mae),
        SANGUE_TP_RH: this.normalizeOptionalText(payload.sangueTpRh),
        RG: this.normalizeOptionalText(payload.rg),
        RG_ORGAO: this.normalizeOptionalText(payload.rgOrgao),
        RG_UF: this.normalizeOptionalText(payload.rgUf),
        DATAEXPRG: this.toDateValue(payload.dataExpRg),
        SEXO: this.normalizeOptionalText(payload.sexo),
        ESTADOCIVIL: this.normalizeOptionalText(payload.estadoCivil),
        TELEFONE: this.sanitizePhone(payload.telefone),
        CELULAR: this.sanitizePhone(payload.celular),
        DATANASCIMENTO: this.toDateValue(payload.dataNascimento),
        RACA: this.normalizeOptionalText(payload.raca),
        CELULARII: this.sanitizePhone(payload.celularIi),
        ENDERECO_ACR: enderecoAcr,
        COMPLEMENTO_ACR: complementoAcr,
        BAIRRO_ACR: bairroAcr,
        CIDADE_ACR: cidadeAcr,
        ESTADO_ACR: estadoAcr,
        CEP_ACR: cepAcr,
        NUMERO_ACR: numeroAcr,
        ENDERECO_ALTERADO_SET: enderecoFoiAlterado ? 1 : 0,
        NOME_SOCIAL: this.normalizeOptionalText(payload.nomeSocial),
        ESPECIFICAR_GENERO: this.normalizeOptionalText(payload.especificarGenero),
        ORIENTACAO_SEXUAL: this.normalizeOptionalText(payload.orientacaoSexual),
        FOTO_IMG_SET: fotoFoiInformada ? 1 : 0,
        FOTO_IMG: fotoBuffer
      }
    );

    return {
      success: true,
      message: enderecoFoiAlterado
        ? "Dados atualizados com sucesso. Alterações de endereço seguirão para análise da equipe responsável."
        : "Dados atualizados com sucesso."
    };
  }

  async create(payload: CreateUserDto) {
    const cpfDigits = this.sanitizeCpf(payload.cpf);
    const email = payload.email?.trim().toLowerCase();
    const whatsapp = this.sanitizePhone(payload.whatsapp);
    const firstPassword = this.generateFirstPassword();

    const alreadyExists = await this.checkCpfExists(cpfDigits);
    if (alreadyExists.exists) {
      throw new ConflictException("Já existe cadastro com este CPF.");
    }

    if (payload.preferredChannel === "email" && !email) {
      throw new BadRequestException("E-mail obrigatório para envio da primeira senha.");
    }

    if (payload.preferredChannel === "whatsapp" && !whatsapp) {
      throw new BadRequestException("WhatsApp obrigatório para envio da primeira senha.");
    }

    await this.legacyDatabaseService.query(
      `
      Insert Into PESSOAS_LOGIN
        (CPF, SENHA, EMAIL, WHATSAPP)
      Values
        (@CPF, @SENHA, @EMAIL, @WHATSAPP)
      `,
      {
        CPF: cpfDigits,
        SENHA: firstPassword,
        EMAIL: email ?? null,
        WHATSAPP: whatsapp ?? null
      }
    );

    if (payload.preferredChannel === "email" && email) {
      await this.sendFirstPasswordEmail({
        to: email,
        cpf: cpfDigits,
        password: firstPassword
      });
    }

    if (payload.preferredChannel === "whatsapp" && whatsapp) {
      await this.sendFirstPasswordWhatsapp({
        cpf: cpfDigits,
        whatsapp,
        password: firstPassword
      });
    }

    return {
      message: "Cadastro realizado com sucesso.",
      payloadPreview: {
        cpf: cpfDigits,
        email: email ?? null,
        whatsapp: whatsapp ?? null,
        preferredChannel: payload.preferredChannel,
        firstPasswordSentBy: payload.preferredChannel
      }
    };
  }
}
