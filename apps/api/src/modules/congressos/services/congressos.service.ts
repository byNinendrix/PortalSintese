import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { LegacyDatabaseService } from "../../../infra/legacy-database/legacy-database.service";
import { AuditoriaService } from "../../auditoria/auditoria.service";
import { CarimbarPresencaDto } from "../dto/carimbar-presenca.dto";
import { CertificadoCongressistaDto } from "../dto/certificado-congressista.dto";
import { ConsultaCongressistaDto } from "../dto/consulta-congressista.dto";

interface CongressoAtivoRow {
  ID_CONGRESSO: number | null;
  ANO: number | string | null;
  DISCRIMINACAO: string | null;
  LOCAL: string | null;
  DATA_INICIO: Date | string | null;
  DATA_FIM: Date | string | null;
  HORA_INICIO: Date | string | null;
  HORA_FIM: Date | string | null;
  TEMA_GERAL: string | null;
  LOGO: unknown;
  LOCAL_PRE: string | null;
  ENDERECO: string | null;
}

interface CongressoAtivoIdRow {
  ID_CONGRESSO: number | null;
}

interface CongressoPalestranteRow {
  NOME: string | null;
  CARGOFUNCAO: string | null;
  DATA_PALESTRA: Date | string | null;
}

interface PresencaPalestraRow {
  DATA_PALESTRA: Date | string | null;
  DISPONIVEL: number | boolean | string | null;
}

interface UsuarioAdministrativoRow {
  USR_CODIGO: number | null;
  USR_LOGIN: string | null;
  USR_SENHA: string | null;
  USR_ADMINISTRADOR: string | null;
}

interface PresencaAtivaRow {
  DATA_PALESTRA: Date | string | null;
  CONFIRMADO: unknown;
  DATA_CONFIRMACAO: Date | string | null;
  USUARIO_CONFIRMACAO: string | null;
}

interface CongressoCongressistaRow {
  ID_CONGRESSISTA: number | null;
  ID_CONGRESSO: number | null;
  ID_FILIADO: number | null;
  CREDENCIADO: unknown;
  DESISTIU: unknown;
  CRECHE: unknown;
  TRANSPORTE: unknown;
  FUNCAO: string | null;
  DELEGACAO: string | null;
  PLENARIA: string | null;
  TAMANHO_CAMISA: string | null;
  NOME_CONGRESSISTA: string | null;
  SEXO_RAW: string | null;
  ID_CONG_GRUPO: number | null;
  ID_GRUPO: number | null;
  GRUPO_ESTUDO_DESCRICAO: string | null;
  ID_CONG_HOTEL_CAPA: number | null;
  ID_CONG_HOTEL_CAPA_D: number | null;
  ID_CONG_HOTEL_CAPA_RESOLVIDO: number | null;
  HOSPEDAGEM_DESCRICAO: string | null;
}

interface CertificadoCongressistaRow {
  ID_CONGRESSISTA: number | null;
  ID_CONGRESSO: number | null;
  CPF_NORMALIZADO: string | null;
  CREDENCIADO: unknown;
  FUNCAO: string | null;
  DELEGACAO: string | null;
  PLENARIA: string | null;
  NOME_CONGRESSISTA: string | null;
  ANO: number | string | null;
  DISCRIMINACAO: string | null;
  TEMA_GERAL: string | null;
  LOCAL: string | null;
  ENDERECO: string | null;
  DATA_INICIO: Date | string | null;
  DATA_FIM: Date | string | null;
  HORA_INICIO: Date | string | null;
  HORA_FIM: Date | string | null;
  LOGO: unknown;
}

interface CongressoDependenteRow {
  ID_CONGRESSISTA_DEP: number | null;
  NOME: string | null;
  GENERO: string | null;
  IDADE: number | string | null;
  FAIXA: string | null;
  NASCIMENTO_EXTENSO: string | null;
  ID_CONG_HOTEL_CAPA: number | null;
  HOSPEDAGEM_DESCRICAO: string | null;
  POSSUI_DEFICIENCIA: unknown;
  DESCRICAO_DEFICIENCIA: string | null;
  PROBLEMA_SAUDE: unknown;
  DESCRICAO_SAUDE: string | null;
  RESTRICAO_ALIMENTAR: unknown;
  DESCRICAO_ALIMENTAR: string | null;
  ALERGIA: unknown;
  DESCRICAO_ALERGIA: string | null;
  UTILIZA_MEDICAMENTO: unknown;
  DESCRICAO_MEDICAMENTO: string | null;
  OBSERVACAO: string | null;
}

interface CertificadoLayoutPayload {
  layout?: unknown;
}

const CERTIFICADO_LAYOUT_MAX_IMAGE_BYTES = 2 * 1024 * 1024;

@Injectable()
export class CongressosService {
  constructor(
    private readonly legacyDatabaseService: LegacyDatabaseService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private getCertificadoLayoutFilePath(): string {
    return path.resolve(
      process.cwd(),
      ".local-dev",
      "certificado-congresso-layout-v1.json",
    );
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isValidCertificadoImage(value: unknown): boolean {
    if (value === null || value === undefined || value === "") {
      return true;
    }

    if (typeof value !== "string") {
      return false;
    }

    const match = value
      .trim()
      .match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=\r\n]+)$/);

    if (!match) {
      return false;
    }

    const base64 = match[2].replace(/\s/g, "");
    const estimatedBytes = Math.floor((base64.length * 3) / 4);
    return estimatedBytes <= CERTIFICADO_LAYOUT_MAX_IMAGE_BYTES;
  }

  private isValidCertificadoField(value: unknown): boolean {
    if (!this.isPlainObject(value)) {
      return false;
    }

    return (
      Number.isFinite(Number(value.x)) &&
      Number.isFinite(Number(value.y)) &&
      Number.isFinite(Number(value.w)) &&
      Number.isFinite(Number(value.h)) &&
      Number.isFinite(Number(value.fontSize))
    );
  }

  private isValidFaceCampos(
    campos: unknown,
    requiredFields: string[],
  ): boolean {
    if (!this.isPlainObject(campos)) {
      return false;
    }
    const camposObj = campos as Record<string, unknown>;
    return requiredFields.every((field) =>
      this.isValidCertificadoField(camposObj[field]),
    );
  }

  private isValidCertificadoFace(
    face: unknown,
    requiredFields: string[],
  ): boolean {
    if (!this.isPlainObject(face)) {
      return false;
    }
    if (!this.isValidCertificadoImage(face.imagemBase)) {
      return false;
    }
    return this.isValidFaceCampos(face.campos, requiredFields);
  }

  private isValidCertificadoLayout(layout: unknown): boolean {
    if (!this.isPlainObject(layout)) {
      return false;
    }

    const orientacao = layout.orientacao;
    if (orientacao !== "landscape" && orientacao !== "portrait") {
      return false;
    }

    const frenteFields = [
      "textoCertificado",
      "nomeCongressista",
      "nomeCongresso",
      "temaGeral",
      "periodoCongresso",
      "local",
      "funcao",
      "delegacao",
      "plenaria",
      "dataEmissao",
      "assinaturaOrganizacao",
    ];

    const versoFields = [
      "tituloProgramacao",
      "programacaoCongresso",
      "observacaoProgramacao",
    ];

    if (
      layout.version === 2 &&
      this.isPlainObject(layout.frente) &&
      this.isPlainObject(layout.verso)
    ) {
      return (
        this.isValidCertificadoFace(layout.frente, frenteFields) &&
        this.isValidCertificadoFace(layout.verso, versoFields)
      );
    }

    if (!this.isValidCertificadoImage(layout.imagemBase)) {
      return false;
    }
    if (!this.isPlainObject(layout.campos)) {
      return false;
    }
    const campos = layout.campos as Record<string, unknown>;
    return frenteFields.every((field) =>
      this.isValidCertificadoField(campos[field]),
    );
  }

  async getCertificadoLayout(): Promise<{
    layout: Record<string, unknown> | null;
  }> {
    const filePath = this.getCertificadoLayoutFilePath();

    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!this.isValidCertificadoLayout(parsed)) {
        return { layout: null };
      }

      void this.auditoriaService.registrarAcao(
        "Configuracao layout certificado congresso acessada",
      );

      return { layout: parsed as Record<string, unknown> };
    } catch (error) {
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code ?? "")
          : "";

      if (errorCode === "ENOENT") {
        void this.auditoriaService.registrarAcao(
          "Configuracao layout certificado congresso acessada",
        );
        return { layout: null };
      }

      throw new InternalServerErrorException(
        "Nao foi possivel carregar o layout do certificado.",
      );
    }
  }

  async saveCertificadoLayout(
    payload: CertificadoLayoutPayload,
  ): Promise<{ success: true }> {
    const candidate = payload.layout;
    if (!this.isValidCertificadoLayout(candidate)) {
      throw new BadRequestException("Layout do certificado invalido.");
    }

    const filePath = this.getCertificadoLayoutFilePath();
    const folder = path.dirname(filePath);

    try {
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(candidate, null, 2), "utf8");

      void this.auditoriaService.registrarAcao(
        "Layout certificado congresso salvo",
      );

      if (this.isPlainObject(candidate)) {
        if (
          candidate.version === 2 &&
          this.isPlainObject(candidate.frente) &&
          this.isPlainObject(candidate.verso)
        ) {
          const frente = candidate.frente as Record<string, unknown>;
          const verso = candidate.verso as Record<string, unknown>;
          if (
            typeof frente.imagemBase === "string" &&
            frente.imagemBase.trim().length > 0
          ) {
            void this.auditoriaService.registrarAcao(
              "Imagem frente certificado congresso enviada",
            );
          }
          if (
            typeof verso.imagemBase === "string" &&
            verso.imagemBase.trim().length > 0
          ) {
            void this.auditoriaService.registrarAcao(
              "Imagem verso certificado congresso enviada",
            );
          }
        } else if (
          typeof candidate.imagemBase === "string" &&
          candidate.imagemBase.trim().length > 0
        ) {
          void this.auditoriaService.registrarAcao(
            "Imagem certificado congresso enviada",
          );
        }
      }

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Nao foi possivel salvar o layout do certificado.",
      );
    }
  }

  private digitsOnly(value: unknown): string {
    return typeof value === "string" ? value.replace(/\D/g, "") : "";
  }

  private toText(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const text = String(value).trim();
    return text || null;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toBoolean(value: unknown): boolean {
    if (value === true || value === 1) {
      return true;
    }

    if (
      value === false ||
      value === 0 ||
      value === null ||
      value === undefined
    ) {
      return false;
    }

    if (typeof value === "string") {
      const normalized = value
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

      return (
        normalized === "1" ||
        normalized === "S" ||
        normalized === "SIM" ||
        normalized === "TRUE"
      );
    }

    return false;
  }

  private normalizarSexo(value: unknown): string {
    if (typeof value !== "string") {
      return "Não informado";
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === "F") {
      return "Feminino";
    }
    if (normalized === "M") {
      return "Masculino";
    }
    if (normalized === "N") {
      return "Não Binário";
    }

    return "Não informado";
  }

  private toSerializableDateTime(value: unknown): string | null {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return this.toText(value);
  }

  private getImageMimeType(bytes: Buffer): string | null {
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png";
    }

    if (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    ) {
      return "image/jpeg";
    }

    if (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
      return "image/webp";
    }

    return null;
  }

  private normalizarLogoCongresso(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
      const bytes = Buffer.from(value);
      const mimeType = this.getImageMimeType(bytes);
      return mimeType
        ? `data:${mimeType};base64,${bytes.toString("base64")}`
        : null;
    }

    if (value instanceof ArrayBuffer) {
      const bytes = Buffer.from(value);
      const mimeType = this.getImageMimeType(bytes);
      return mimeType
        ? `data:${mimeType};base64,${bytes.toString("base64")}`
        : null;
    }

    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    if (
      normalized.startsWith("data:image/png;base64,") ||
      normalized.startsWith("data:image/jpeg;base64,") ||
      normalized.startsWith("data:image/webp;base64,") ||
      normalized.startsWith("https://") ||
      normalized.startsWith("http://") ||
      normalized.startsWith("/")
    ) {
      return normalized;
    }

    return null;
  }

  private async findCongressoAtivoId(): Promise<number | null> {
    const rows = await this.legacyDatabaseService.query<CongressoAtivoIdRow>(`
      SELECT TOP 1
            ID_CONGRESSO
      FROM SINTESE.dbo.CONGRESSO
      WHERE CONCLUIDO = 0
      ORDER BY ID_CONGRESSO DESC
    `);

    return this.toNumber(rows[0]?.ID_CONGRESSO);
  }

  async findAtivo() {
    const rows = await this.legacyDatabaseService.query<CongressoAtivoRow>(`
      SELECT TOP 1
            ID_CONGRESSO,
            ANO,
            DISCRIMINACAO,
            LOCAL,
            DATA_INICIO,
            DATA_FIM,
            HORA_INICIO,
            HORA_FIM,
            TEMA_GERAL,
            LOGO,
            LOCAL_PRE,
            ENDERECO
      FROM SINTESE.dbo.CONGRESSO
      WHERE CONCLUIDO = 0
      ORDER BY ID_CONGRESSO DESC
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const idCongresso = this.toNumber(row.ID_CONGRESSO);
    const palestrantes =
      idCongresso === null
        ? []
        : await this.legacyDatabaseService.query<CongressoPalestranteRow>(
            `
          SELECT
                NOME,
                CARGOFUNCAO,
                DATA_PALESTRA
          FROM SINTESE.dbo.CONGRESSO_PALESTRANTE
          WHERE ID_CONGRESSO = @ID_CONGRESSO
          ORDER BY DATA_PALESTRA, NOME
          `,
            { ID_CONGRESSO: idCongresso },
          );

    return {
      id_congresso: this.toNumber(row.ID_CONGRESSO),
      ano: typeof row.ANO === "number" ? row.ANO : this.toText(row.ANO),
      discriminacao: this.toText(row.DISCRIMINACAO),
      tema_geral: this.toText(row.TEMA_GERAL),
      local: this.toText(row.LOCAL),
      local_pre: this.toText(row.LOCAL_PRE),
      endereco: this.toText(row.ENDERECO),
      data_inicio: this.toSerializableDateTime(row.DATA_INICIO),
      data_fim: this.toSerializableDateTime(row.DATA_FIM),
      hora_inicio: this.toSerializableDateTime(row.HORA_INICIO),
      hora_fim: this.toSerializableDateTime(row.HORA_FIM),
      logo: this.normalizarLogoCongresso(row.LOGO),
      palestrantes: palestrantes.map((palestrante) => ({
        nome: this.toText(palestrante.NOME),
        cargo_funcao: this.toText(palestrante.CARGOFUNCAO),
        data_palestra: this.toSerializableDateTime(palestrante.DATA_PALESTRA),
      })),
    };
  }

  private isIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  private md5(value: string): string {
    return createHash("md5").update(value, "utf8").digest("hex");
  }

  private getPasswordHashes(password: string, codigo: number): Set<string> {
    const trimmedPassword = password.trim();
    const values = [
      password,
      trimmedPassword,
      password.toUpperCase(),
      password.toLowerCase(),
      String(codigo) + password,
      String(codigo) + trimmedPassword,
      password + String(codigo),
      trimmedPassword + String(codigo),
    ];

    return new Set(values.map((value) => this.md5(value).toLowerCase()));
  }

  private isTrueFlag(value: unknown): boolean {
    const normalized = String(value ?? "")
      .trim()
      .toUpperCase();
    return (
      normalized === "1" ||
      normalized === "S" ||
      normalized === "SIM" ||
      normalized === "TRUE"
    );
  }

  private sanitizarUsuarioAuditoria(usuario: string): string {
    return usuario
      .replace(/[^\w\sÀ-ÿ.:_\-@]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 50) || "desconhecido";
  }

  private async registrarAuditoriaPorCongressista(
    motivo: string,
    idCongressista: number,
    idCongresso: number,
  ): Promise<void> {
    try {
      const rows = await this.legacyDatabaseService.query<{ CPF: string | null }>(
        `
        SELECT TOP 1
          REPLACE(REPLACE(REPLACE(CPF, '.', ''), '-', ''), ' ', '') AS CPF
        FROM SINTESE.dbo.CONGRESSO_CONGRESSISTA
        WHERE ID_CONGRESSISTA = @ID_CONGRESSISTA
          AND ID_CONGRESSO = @ID_CONGRESSO
        `,
        { ID_CONGRESSISTA: idCongressista, ID_CONGRESSO: idCongresso },
      );
      const cpf = rows[0]?.CPF?.replace(/\D/g, "");
      const cpfValido = cpf?.length === 11 ? cpf : null;
      await this.auditoriaService.registrarAcao(motivo, cpfValido);
    } catch {
      // falha silenciosa — nunca bloqueia a ação principal
    }
  }

  async carimbarPresenca(body: CarimbarPresencaDto) {
    const usuario = body.usuario.trim();
    const senha = body.senha;

    if (!this.isIsoDate(body.data_palestra) || !usuario || !senha) {
      throw new BadRequestException(
        "Não foi possível validar os dados informados.",
      );
    }

    const idCongresso = await this.findCongressoAtivoId();
    if (!idCongresso) {
      throw new BadRequestException("Congresso ativo não encontrado.");
    }

    try {
      const congressistaRows = await this.legacyDatabaseService.query<{
        ID_CONGRESSISTA: number;
      }>(
        `
        SELECT TOP 1 ID_CONGRESSISTA
        FROM SINTESE.dbo.CONGRESSO_CONGRESSISTA
        WHERE ID_CONGRESSO = @ID_CONGRESSO
          AND ID_CONGRESSISTA = @ID_CONGRESSISTA
        `,
        { ID_CONGRESSO: idCongresso, ID_CONGRESSISTA: body.id_congressista },
      );

      if (congressistaRows.length === 0) {
        throw new BadRequestException(
          "Congressista inválido para o congresso ativo.",
        );
      }

      const palestraRows =
        await this.legacyDatabaseService.query<PresencaPalestraRow>(
          `
        SELECT TOP 1
              DATA_PALESTRA,
              CASE WHEN CONVERT(date, DATA_PALESTRA) <= CONVERT(date, GETDATE()) THEN 1 ELSE 0 END AS DISPONIVEL
        FROM SINTESE.dbo.CONGRESSO_PALESTRANTE
        WHERE ID_CONGRESSO = @ID_CONGRESSO
          AND CONVERT(date, DATA_PALESTRA) = CONVERT(date, @DATA_PALESTRA)
        `,
          { ID_CONGRESSO: idCongresso, DATA_PALESTRA: body.data_palestra },
        );

      const palestra = palestraRows[0];
      if (!palestra) {
        throw new BadRequestException(
          "Palestra inválida para o congresso ativo.",
        );
      }

      if (!this.isTrueFlag(palestra.DISPONIVEL)) {
        throw new BadRequestException(
          "A presença só pode ser confirmada na data da palestra ou depois.",
        );
      }

      const usuarioRows =
        await this.legacyDatabaseService.query<UsuarioAdministrativoRow>(
          `
        SELECT TOP 1
            USR_CODIGO,
              USR_LOGIN,
              USR_SENHA,
              USR_ADMINISTRADOR
        FROM SINTESE.dbo.FR_USUARIO
          WHERE UPPER(LTRIM(RTRIM(USR_LOGIN))) = UPPER(LTRIM(RTRIM(@USR_LOGIN)))
        `,
          { USR_LOGIN: usuario },
        );

      const usuarioRow = usuarioRows[0];
      if (
        !usuarioRow ||
        !this.isTrueFlag(usuarioRow.USR_ADMINISTRADOR) ||
        !this.getPasswordHashes(senha, usuarioRow.USR_CODIGO ?? 0).has(
          (usuarioRow.USR_SENHA ?? "").trim().toLowerCase(),
        )
      ) {
        void this.registrarAuditoriaPorCongressista(
          "Tentativa invalida de confirmar presenca congressista",
          body.id_congressista,
          idCongresso,
        );
        throw new BadRequestException("Credenciais administrativas inválidas.");
      }

      const presencaRows =
        await this.legacyDatabaseService.query<PresencaAtivaRow>(
          `
        SELECT TOP 1
              DATA_PALESTRA,
              CONFIRMADO,
              DATA_CONFIRMACAO,
              USUARIO_CONFIRMACAO
        FROM SINTESE.dbo.CONGRESSO_CONGRESSISTA_PRESENCA
        WHERE ID_CONGRESSO = @ID_CONGRESSO
          AND ID_CONGRESSISTA = @ID_CONGRESSISTA
          AND CONVERT(date, DATA_PALESTRA) = CONVERT(date, @DATA_PALESTRA)
          AND CANCELADO = 0
        `,
          {
            ID_CONGRESSO: idCongresso,
            ID_CONGRESSISTA: body.id_congressista,
            DATA_PALESTRA: body.data_palestra,
          },
        );

      if (presencaRows.length > 0) {
        void this.registrarAuditoriaPorCongressista(
          `Presenca congressista ja confirmada consultada por usuario ${this.sanitizarUsuarioAuditoria(usuario)}`,
          body.id_congressista,
          idCongresso,
        );
        throw new ConflictException(
          "A presença já foi confirmada para esta data.",
        );
      }

      const insertedRows =
        await this.legacyDatabaseService.query<PresencaAtivaRow>(
          `
        INSERT INTO SINTESE.dbo.CONGRESSO_CONGRESSISTA_PRESENCA
          (ID_CONGRESSO, ID_CONGRESSISTA, DATA_PALESTRA, CONFIRMADO, USUARIO_CONFIRMACAO, CANCELADO)
        OUTPUT
          INSERTED.DATA_PALESTRA,
          INSERTED.CONFIRMADO,
          INSERTED.DATA_CONFIRMACAO,
          INSERTED.USUARIO_CONFIRMACAO
        VALUES
          (@ID_CONGRESSO, @ID_CONGRESSISTA, CONVERT(date, @DATA_PALESTRA), 1, @USUARIO_CONFIRMACAO, 0)
        `,
          {
            ID_CONGRESSO: idCongresso,
            ID_CONGRESSISTA: body.id_congressista,
            DATA_PALESTRA: body.data_palestra,
            USUARIO_CONFIRMACAO: usuarioRow.USR_LOGIN?.trim() ?? usuario,
          },
        );

      const inserted = insertedRows[0];

      void this.registrarAuditoriaPorCongressista(
        `Presenca congressista confirmada por usuario ${this.sanitizarUsuarioAuditoria(usuarioRow.USR_LOGIN?.trim() ?? usuario)}`,
        body.id_congressista,
        idCongresso,
      );

      return {
        sucesso: true,
        mensagem: "Presença confirmada com sucesso.",
        presenca: {
          data_palestra: this.toSerializableDateTime(
            inserted?.DATA_PALESTRA ?? body.data_palestra,
          ),
          confirmado: this.isTrueFlag(inserted?.CONFIRMADO),
          data_confirmacao: this.toSerializableDateTime(
            inserted?.DATA_CONFIRMACAO,
          ),
          usuario_confirmacao: this.toText(inserted?.USUARIO_CONFIRMACAO),
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Não foi possível confirmar a presença no momento.",
      );
    }
  }

  async findCongressistaAtivo(cpf: string | undefined) {
    const cpfDigits = this.digitsOnly(cpf);

    if (!cpfDigits) {
      throw new BadRequestException("CPF é obrigatório.");
    }

    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF deve conter 11 dígitos.");
    }

    return this.findCongressistaAtivoInternal(cpfDigits);
  }

  async findCongressistaAtivoSeguro(body: ConsultaCongressistaDto) {
    const cpfDigits = this.digitsOnly(body.cpf);
    const dataNascimento = body.dataNascimento?.trim() ?? "";

    if (cpfDigits.length !== 11 || !this.isIsoDate(dataNascimento)) {
      return {
        encontrado: false,
        mensagem: "Não foi possível validar os dados informados.",
      };
    }

    return this.findCongressistaAtivoInternal(cpfDigits, dataNascimento);
  }

  private get emissoesCertificadoPath(): string {
    return path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "..",
      "data",
      "certificados-emissoes.json",
    );
  }

  private async lerEmissoesCertificado(): Promise<
    Record<string, { data_primeira_emissao: string; total_impressoes: number }>
  > {
    try {
      await fs.mkdir(path.dirname(this.emissoesCertificadoPath), {
        recursive: true,
      });
      const raw = await fs.readFile(this.emissoesCertificadoPath, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        "emissoes" in parsed &&
        typeof (parsed as Record<string, unknown>).emissoes === "object"
      ) {
        return (
          (parsed as { emissoes: Record<string, unknown> }).emissoes as Record<
            string,
            { data_primeira_emissao: string; total_impressoes: number }
          >
        );
      }
      return {};
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        (error as NodeJS.ErrnoException).code !== "ENOENT"
      ) {
        console.warn(
          "Falha ao ler arquivo de emissoes de certificado (ignorado).",
        );
      }
      return {};
    }
  }

  private async salvarEmissoesCertificado(
    emissoes: Record<
      string,
      { data_primeira_emissao: string; total_impressoes: number }
    >,
  ): Promise<void> {
    const filePath = this.emissoesCertificadoPath;
    const tmpPath = filePath + ".tmp";
    try {
      const conteudo = JSON.stringify({ emissoes }, null, 2);
      await fs.writeFile(tmpPath, conteudo, "utf-8");
      await fs.rename(tmpPath, filePath);
    } catch {
      console.warn(
        "Falha ao salvar arquivo de emissoes de certificado (ignorado).",
      );
      try {
        await fs.unlink(tmpPath);
      } catch {
      }
    }
  }

  private async obterOuCriarEmissaoCertificado(
    chave: string,
  ): Promise<{ dataEmissao: string; isPrimeiraEmissao: boolean }> {
    const emissoes = await this.lerEmissoesCertificado();
    const existente = emissoes[chave];

    if (existente && typeof existente.data_primeira_emissao === "string") {
      emissoes[chave] = {
        data_primeira_emissao: existente.data_primeira_emissao,
        total_impressoes: (existente.total_impressoes ?? 1) + 1,
      };
      void this.salvarEmissoesCertificado(emissoes);
      return { dataEmissao: existente.data_primeira_emissao, isPrimeiraEmissao: false };
    }

    const dataEmissao = new Date().toISOString();
    emissoes[chave] = { data_primeira_emissao: dataEmissao, total_impressoes: 1 };
    void this.salvarEmissoesCertificado(emissoes);
    return { dataEmissao, isPrimeiraEmissao: true };
  }

  async emitirCertificadoCongressista(body: CertificadoCongressistaDto) {
    const cpfDigits = this.digitsOnly(body.cpf);
    const dataNascimento = body.data_nascimento?.trim() ?? "";

    if (cpfDigits.length !== 11 || !this.isIsoDate(dataNascimento)) {
      throw new BadRequestException(
        "Nao foi possivel validar os dados informados.",
      );
    }

    const idCongresso = await this.findCongressoAtivoId();
    if (!idCongresso) {
      throw new BadRequestException("Congresso ativo nao encontrado.");
    }

    try {
      const rows =
        await this.legacyDatabaseService.query<CertificadoCongressistaRow>(
          `
          SELECT TOP 1
                CC.ID_CONGRESSISTA,
                CC.ID_CONGRESSO,
                REPLACE(REPLACE(REPLACE(CC.CPF, '.', ''), '-', ''), ' ', '') AS CPF_NORMALIZADO,
                CC.CREDENCIADO,
                CC.FUNCAO,
                CC.DELEGACAO,
                CC.PLENARIA,
                COALESCE(NULLIF(LTRIM(RTRIM(P.NOME_SOCIAL)), ''), P.NOME) AS NOME_CONGRESSISTA,
                C.ANO,
                C.DISCRIMINACAO,
                C.TEMA_GERAL,
                C.LOCAL,
                C.ENDERECO,
                C.DATA_INICIO,
                C.DATA_FIM,
                C.HORA_INICIO,
                C.HORA_FIM,
                C.LOGO
          FROM SINTESE.dbo.CONGRESSO_CONGRESSISTA CC
          INNER JOIN SINTESE.dbo.CONGRESSO C
            ON C.ID_CONGRESSO = CC.ID_CONGRESSO
          LEFT JOIN SINTESE.dbo.PESSOAS P
            ON REPLACE(REPLACE(REPLACE(P.CPF, '.', ''), '-', ''), ' ', '') =
               REPLACE(REPLACE(REPLACE(CC.CPF, '.', ''), '-', ''), ' ', '')
          WHERE CC.ID_CONGRESSO = @ID_CONGRESSO
            AND REPLACE(REPLACE(REPLACE(CC.CPF, '.', ''), '-', ''), ' ', '') = @CPF
            AND CONVERT(date, P.DATANASCIMENTO) = CONVERT(date, @DATA_NASCIMENTO)
          ORDER BY CC.ID_CONGRESSISTA DESC
          `,
          {
            ID_CONGRESSO: idCongresso,
            CPF: cpfDigits,
            DATA_NASCIMENTO: dataNascimento,
          },
        );

      const row = rows[0];
      if (!row) {
        void this.auditoriaService.registrarAcao(
          "Tentativa de certificado congressista nao localizado",
          cpfDigits,
        );
        throw new BadRequestException(
          "Nao foi possivel emitir o certificado com os dados informados.",
        );
      }

      const cpfAuditoria = this.digitsOnly(row.CPF_NORMALIZADO);
      const cpfValido = cpfAuditoria.length === 11 ? cpfAuditoria : cpfDigits;

      if (!this.toBoolean(row.CREDENCIADO)) {
        void this.auditoriaService.registrarAcao(
          "Tentativa de certificado congressista nao credenciado",
          cpfValido,
        );
        throw new BadRequestException(
          "Certificado disponivel apenas para congressistas credenciados.",
        );
      }

      const programacaoRows =
        await this.legacyDatabaseService.query<CongressoPalestranteRow>(
          `
          SELECT
                NOME,
                CARGOFUNCAO,
                DATA_PALESTRA
          FROM SINTESE.dbo.CONGRESSO_PALESTRANTE
          WHERE ID_CONGRESSO = @ID_CONGRESSO
          ORDER BY DATA_PALESTRA, NOME
          `,
          { ID_CONGRESSO: idCongresso },
        );

      const chaveEmissao = `${this.toNumber(row.ID_CONGRESSO)}_${cpfDigits}`;
      const { dataEmissao, isPrimeiraEmissao } =
        await this.obterOuCriarEmissaoCertificado(chaveEmissao);

      void this.auditoriaService.registrarAcao(
        isPrimeiraEmissao
          ? "Certificado congressista gerado"
          : "Certificado congressista reimpresso",
        cpfValido,
      );

      return {
        nome: this.toText(row.NOME_CONGRESSISTA),
        funcao: this.toText(row.FUNCAO),
        delegacao: this.toText(row.DELEGACAO),
        plenaria: this.toText(row.PLENARIA),
        congresso: {
          id_congresso: this.toNumber(row.ID_CONGRESSO),
          ano: typeof row.ANO === "number" ? row.ANO : this.toText(row.ANO),
          discriminacao: this.toText(row.DISCRIMINACAO),
          tema_geral: this.toText(row.TEMA_GERAL),
          local: this.toText(row.LOCAL),
          endereco: this.toText(row.ENDERECO),
          data_inicio: this.toSerializableDateTime(row.DATA_INICIO),
          data_fim: this.toSerializableDateTime(row.DATA_FIM),
          hora_inicio: this.toSerializableDateTime(row.HORA_INICIO),
          hora_fim: this.toSerializableDateTime(row.HORA_FIM),
          logo: this.normalizarLogoCongresso(row.LOGO),
        },
        programacao: programacaoRows.map((p) => ({
          nome: this.toText(p.NOME),
          cargo_funcao: this.toText(p.CARGOFUNCAO),
          data_palestra: this.toSerializableDateTime(p.DATA_PALESTRA),
        })),
        data_emissao: dataEmissao,
        credenciado: true,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Nao foi possivel emitir o certificado no momento.",
      );
    }
  }

  private async findCongressistaAtivoInternal(
    cpfDigits: string,
    dataNascimento?: string,
  ) {
    try {
      const idCongresso = await this.findCongressoAtivoId();

      if (!idCongresso) {
        return {
          encontrado: false,
          mensagem: "Nenhum congresso ativo encontrado no momento.",
        };
      }

      const rows =
        await this.legacyDatabaseService.query<CongressoCongressistaRow>(
          `
        SELECT TOP 1
              CC.ID_CONGRESSISTA,
              CC.ID_CONGRESSO,
              CC.ID_FILIADO,
              CC.CREDENCIADO,
              CC.DESISTIU,
              CC.CRECHE,
              CC.TRANSPORTE,
              CC.FUNCAO,
              CC.DELEGACAO,
              CC.PLENARIA,
              CC.TAMANHO_CAMISA,
              COALESCE(NULLIF(LTRIM(RTRIM(P.NOME_SOCIAL)), ''), P.NOME) AS NOME_CONGRESSISTA,
              P.SEXO AS SEXO_RAW,
              CC.ID_CONG_GRUPO,
              GE.ID_GRUPO,
              CC.ID_CONG_HOTEL_CAPA,
              CC.ID_CONG_HOTEL_CAPA_D,
              COALESCE(CC.ID_CONG_HOTEL_CAPA, CC.ID_CONG_HOTEL_CAPA_D) AS ID_CONG_HOTEL_CAPA_RESOLVIDO,
              CASE
                WHEN GE.ID_CONG_GRUPO IS NULL THEN NULL
                ELSE CONCAT(
                  NULLIF(LTRIM(RTRIM(CG.DESCRICAO)), ''),
                  CASE WHEN NULLIF(LTRIM(RTRIM(CG.LOCAL)), '') IS NOT NULL THEN ' - ' + LTRIM(RTRIM(CG.LOCAL)) ELSE '' END,
                  CASE WHEN NULLIF(LTRIM(RTRIM(CG.SALA)), '') IS NOT NULL THEN ' - ' + LTRIM(RTRIM(CG.SALA)) ELSE '' END,
                  CASE WHEN NULLIF(LTRIM(RTRIM(CONVERT(varchar(255), dbo.splitgrupo(CG.ID_GRUPO)))), '') IS NOT NULL
                    THEN ' - ' + LTRIM(RTRIM(CONVERT(varchar(255), dbo.splitgrupo(CG.ID_GRUPO))))
                    ELSE ''
                  END,
                  ' - Inscrito(s): ',
                  ISNULL(VQ.QTDAINSCRITO, 0)
                )
              END AS GRUPO_ESTUDO_DESCRICAO,
              CASE
                WHEN COALESCE(CC.ID_CONG_HOTEL_CAPA, CC.ID_CONG_HOTEL_CAPA_D) IS NULL
                  OR HC.ID_CONG_HOTEL_CAPA IS NULL THEN NULL
                ELSE CONCAT(
                  CASE WHEN ISNULL(TA.QUANTIDADE, 0) - ISNULL(VQH.QTDAHOSPEDE, 0) <= 0 THEN '*' ELSE '' END,
                  CASE WHEN ISNULL(TA.QUANTIDADE, 0) - ISNULL(VQH.QTDAHOSPEDE, 0) <= 0 THEN ' ' ELSE '' END,
                  RTRIM(CAST(HC.ID_CONG_HOTEL_CAPA AS varchar(20))),
                  ' - ',
                  ISNULL(NULLIF(LTRIM(RTRIM(H.DESCRICAO)), ''), 'Hotel não informado'),
                  ' - ',
                  ISNULL(NULLIF(LTRIM(RTRIM(HC.TIPO_APTO)), ''), 'Tipo não informado'),
                  CASE
                    WHEN NULLIF(LTRIM(RTRIM(ISNULL(HC.NUMERO_QUARTO, ''))), '') IS NULL THEN ''
                    ELSE ' Quarto: ' + LTRIM(RTRIM(HC.NUMERO_QUARTO))
                  END,
                  ' Vagas: ',
                  CAST(ISNULL(TA.QUANTIDADE, 0) AS varchar(4)),
                  ' Livre: ',
                  CAST(ISNULL(TA.QUANTIDADE, 0) - ISNULL(VQH.QTDAHOSPEDE, 0) AS varchar(5)),
                  ' ',
                  ISNULL(dbo.sexo(HC.GENERO), 'Não informado')
                )
              END AS HOSPEDAGEM_DESCRICAO
        FROM SINTESE.dbo.CONGRESSO_CONGRESSISTA CC
        LEFT JOIN SINTESE.dbo.PESSOAS P
          ON REPLACE(REPLACE(REPLACE(P.CPF, '.', ''), '-', ''), ' ', '') =
             REPLACE(REPLACE(REPLACE(CC.CPF, '.', ''), '-', ''), ' ', '')
        LEFT JOIN SINTESE.dbo.CONGRESSO_GRP_ESTUDO GE
          ON GE.ID_CONGRESSO = CC.ID_CONGRESSO
         AND GE.ID_CONG_GRUPO = CC.ID_CONG_GRUPO
        LEFT JOIN SINTESE.dbo.CONGRESSO_GRUPO CG
          ON CG.ID_GRUPO = GE.ID_GRUPO
        LEFT JOIN SINTESE.dbo.vw_congresso_qtda_grupo VQ
          ON VQ.ID_CONGRESSO = GE.ID_CONGRESSO
         AND VQ.ID_CONG_GRUPO = GE.ID_CONG_GRUPO
        LEFT JOIN SINTESE.dbo.CONGRESSO_HOTEL_CAPACIDADE HC
          ON HC.ID_CONG_HOTEL_CAPA = COALESCE(CC.ID_CONG_HOTEL_CAPA, CC.ID_CONG_HOTEL_CAPA_D)
        LEFT JOIN SINTESE.dbo.CONGRESSO_HOTEL CH
          ON CH.ID_CONG_HOTEL = HC.ID_CONG_HOTEL
         AND CH.ID_CONGRESSO = CC.ID_CONGRESSO
        LEFT JOIN SINTESE.dbo.HOTEL H
          ON H.ID_HOTEL = CH.ID_HOTEL
        LEFT JOIN SINTESE.dbo.TIPO_APARTAMENTO TA
          ON TA.CODIGO = HC.TIPO_APTO
        LEFT JOIN SINTESE.dbo.vw_congresso_qtda_hospede VQH
          ON VQH.ID_CONGRESSO = CH.ID_CONGRESSO
         AND VQH.ID_CONG_HOTEL_CAPA = HC.ID_CONG_HOTEL_CAPA
        WHERE CC.ID_CONGRESSO = @ID_CONGRESSO
          AND REPLACE(REPLACE(REPLACE(CC.CPF, '.', ''), '-', ''), ' ', '') = @CPF
          AND (@DATA_NASCIMENTO IS NULL OR CONVERT(date, P.DATANASCIMENTO) = CONVERT(date, @DATA_NASCIMENTO))
        ORDER BY CC.ID_CONGRESSISTA DESC
        `,
          {
            ID_CONGRESSO: idCongresso,
            CPF: cpfDigits,
            DATA_NASCIMENTO: dataNascimento ?? null,
          },
        );

      const row = rows[0];
      if (!row) {
        void this.auditoriaService.registrarAcao(
          "Consulta congressista nao localizada",
          cpfDigits,
        );
        return {
          encontrado: false,
          mensagem: dataNascimento
            ? "Não foi possível validar os dados informados."
            : "CPF não localizado como congressista neste congresso.",
        };
      }

      const idCongressista = this.toNumber(row.ID_CONGRESSISTA);
      const idCongressoRow = this.toNumber(row.ID_CONGRESSO);
      const presencasConfirmadas =
        idCongressista !== null && idCongressoRow !== null
          ? await this.legacyDatabaseService.query<{
              DATA_PALESTRA: string | null;
            }>(
              `
              SELECT DISTINCT CONVERT(varchar(10), DATA_PALESTRA, 23) AS DATA_PALESTRA
              FROM SINTESE.dbo.CONGRESSO_CONGRESSISTA_PRESENCA
              WHERE ID_CONGRESSO = @ID_CONGRESSO
                AND ID_CONGRESSISTA = @ID_CONGRESSISTA
                AND CONFIRMADO = 1
                AND CANCELADO = 0
              ORDER BY DATA_PALESTRA
              `,
              {
                ID_CONGRESSO: idCongressoRow,
                ID_CONGRESSISTA: idCongressista,
              },
            )
          : [];
      const dependentes =
        idCongressista !== null && idCongressoRow !== null
          ? await this.legacyDatabaseService.query<CongressoDependenteRow>(
              `
              SELECT
                    D.ID_CONGRESSISTA_DEP,
                    D.NOME,
                    D.GENERO,
                    D.IDADE,
                    D.POSSUI_DEFICIENCIA,
                    D.DESCRICAO_DEFICIENCIA,
                    D.PROBLEMA_SAUDE,
                    D.DESCRICAO_SAUDE,
                    D.RESTRICAO_ALIMENTAR,
                    D.DESCRICAO_ALIMENTAR,
                    D.ALERGIA,
                    D.DESCRICAO_ALERGIA,
                    D.UTILIZA_MEDICAMENTO,
                    D.DESCRICAO_MEDICAMENTO,
                    D.OBSERVACAO,
                    COALESCE(
                      NULLIF(LTRIM(RTRIM(D.FAIXA)), ''),
                      dbo.FaixaRecriarIdadeNascimento(D.DATA_NASCIMENTO)
                    ) AS FAIXA,
                    dbo.idadeextenso(D.DATA_NASCIMENTO, GETDATE()) AS NASCIMENTO_EXTENSO,
                    D.ID_CONG_HOTEL_CAPA,
                    CASE
                      WHEN D.ID_CONG_HOTEL_CAPA IS NULL
                        OR HC.ID_CONG_HOTEL_CAPA IS NULL THEN NULL
                      ELSE CONCAT(
                        CASE WHEN ISNULL(TA.QUANTIDADE, 0) - ISNULL(VQH.QTDAHOSPEDE, 0) <= 0 THEN '*' ELSE '' END,
                        CASE WHEN ISNULL(TA.QUANTIDADE, 0) - ISNULL(VQH.QTDAHOSPEDE, 0) <= 0 THEN ' ' ELSE '' END,
                        RTRIM(CAST(HC.ID_CONG_HOTEL_CAPA AS varchar(20))),
                        ' - ',
                        ISNULL(NULLIF(LTRIM(RTRIM(H.DESCRICAO)), ''), 'Hotel nao informado'),
                        ' - ',
                        ISNULL(NULLIF(LTRIM(RTRIM(HC.TIPO_APTO)), ''), 'Tipo nao informado'),
                        CASE
                          WHEN NULLIF(LTRIM(RTRIM(ISNULL(HC.NUMERO_QUARTO, ''))), '') IS NULL THEN ''
                          ELSE ' Quarto: ' + LTRIM(RTRIM(HC.NUMERO_QUARTO))
                        END,
                        ' Vagas: ',
                        CAST(ISNULL(TA.QUANTIDADE, 0) AS varchar(4)),
                        ' Livre: ',
                        CAST(ISNULL(TA.QUANTIDADE, 0) - ISNULL(VQH.QTDAHOSPEDE, 0) AS varchar(5)),
                        ' ',
                        ISNULL(dbo.sexo(HC.GENERO), 'Nao informado')
                      )
                    END AS HOSPEDAGEM_DESCRICAO
              FROM SINTESE.dbo.CONGRESSO_CONGRESSISTA_DEP D
              LEFT JOIN SINTESE.dbo.CONGRESSO_HOTEL_CAPACIDADE HC
                ON HC.ID_CONG_HOTEL_CAPA = D.ID_CONG_HOTEL_CAPA
              LEFT JOIN SINTESE.dbo.CONGRESSO_HOTEL CH
                ON CH.ID_CONG_HOTEL = HC.ID_CONG_HOTEL
               AND CH.ID_CONGRESSO = D.ID_CONGRESSO
              LEFT JOIN SINTESE.dbo.HOTEL H
                ON H.ID_HOTEL = CH.ID_HOTEL
              LEFT JOIN SINTESE.dbo.TIPO_APARTAMENTO TA
                ON TA.CODIGO = HC.TIPO_APTO
              LEFT JOIN SINTESE.dbo.vw_congresso_qtda_hospede VQH
                ON VQH.ID_CONGRESSO = CH.ID_CONGRESSO
               AND VQH.ID_CONG_HOTEL_CAPA = HC.ID_CONG_HOTEL_CAPA
              WHERE D.ID_CONGRESSISTA = @ID_CONGRESSISTA
                AND D.ID_CONGRESSO = @ID_CONGRESSO
              ORDER BY D.ID_CONGRESSISTA_DEP
              `,
              {
                ID_CONGRESSISTA: idCongressista,
                ID_CONGRESSO: idCongressoRow,
              },
            )
          : [];

      void this.auditoriaService.registrarAcao(
        "Consulta congressista realizada",
        cpfDigits,
      );

      return {
        encontrado: true,
        mensagem: "Congressista localizado para este congresso.",
        presencas_confirmadas: presencasConfirmadas
          .map((presenca) => presenca.DATA_PALESTRA)
          .filter((data): data is string => Boolean(data)),
        congressista: {
          id_congressista: idCongressista,
          id_congresso: idCongressoRow,
          id_filiado: this.toNumber(row.ID_FILIADO),
          nome: this.toText(row.NOME_CONGRESSISTA),
          sexo: this.normalizarSexo(row.SEXO_RAW),
          credenciado: this.toBoolean(row.CREDENCIADO),
          desistiu: this.toBoolean(row.DESISTIU),
          creche: this.toBoolean(row.CRECHE),
          transporte: this.toBoolean(row.TRANSPORTE),
          funcao: this.toText(row.FUNCAO),
          delegacao: this.toText(row.DELEGACAO),
          plenaria: this.toText(row.PLENARIA),
          tamanho_camisa: this.toText(row.TAMANHO_CAMISA),
          grupo_estudo:
            row.ID_CONG_GRUPO !== null && row.ID_CONG_GRUPO !== undefined
              ? {
                  id_cong_grupo: this.toNumber(row.ID_CONG_GRUPO),
                  id_grupo: this.toNumber(row.ID_GRUPO),
                  descricao: this.toText(row.GRUPO_ESTUDO_DESCRICAO),
                }
              : null,
          hospedagem:
            row.ID_CONG_HOTEL_CAPA_RESOLVIDO !== null &&
            row.ID_CONG_HOTEL_CAPA_RESOLVIDO !== undefined
              ? {
                  id_cong_hotel_capa: this.toNumber(
                    row.ID_CONG_HOTEL_CAPA_RESOLVIDO,
                  ),
                  descricao: this.toText(row.HOSPEDAGEM_DESCRICAO),
                }
              : null,
          dependentes: dependentes.map((dependente) => ({
            id_congressista_dep: this.toNumber(dependente.ID_CONGRESSISTA_DEP),
            nome: this.toText(dependente.NOME),
            genero: this.normalizarSexo(dependente.GENERO),
            idade: this.toNumber(dependente.IDADE),
            faixa: this.toText(dependente.FAIXA),
            nascimento_extenso: this.toText(dependente.NASCIMENTO_EXTENSO),
            hospedagem:
              dependente.ID_CONG_HOTEL_CAPA !== null &&
              dependente.ID_CONG_HOTEL_CAPA !== undefined
                ? {
                    id_cong_hotel_capa: this.toNumber(
                      dependente.ID_CONG_HOTEL_CAPA,
                    ),
                    descricao: this.toText(dependente.HOSPEDAGEM_DESCRICAO),
                  }
                : null,
            possui_deficiencia: this.toBoolean(dependente.POSSUI_DEFICIENCIA),
            descricao_deficiencia: this.toText(
              dependente.DESCRICAO_DEFICIENCIA,
            ),
            problema_saude: this.toBoolean(dependente.PROBLEMA_SAUDE),
            descricao_saude: this.toText(dependente.DESCRICAO_SAUDE),
            restricao_alimentar: this.toBoolean(dependente.RESTRICAO_ALIMENTAR),
            descricao_alimentar: this.toText(dependente.DESCRICAO_ALIMENTAR),
            alergia: this.toBoolean(dependente.ALERGIA),
            descricao_alergia: this.toText(dependente.DESCRICAO_ALERGIA),
            utiliza_medicamento: this.toBoolean(dependente.UTILIZA_MEDICAMENTO),
            descricao_medicamento: this.toText(
              dependente.DESCRICAO_MEDICAMENTO,
            ),
            observacao: this.toText(dependente.OBSERVACAO),
          })),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Não foi possível consultar o congressista no momento.",
      );
    }
  }
}
