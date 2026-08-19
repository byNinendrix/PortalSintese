import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { LegacyDatabaseService } from "../../../infra/legacy-database/legacy-database.service";
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

@Injectable()
export class CongressosService {
  constructor(private readonly legacyDatabaseService: LegacyDatabaseService) {}

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
        return {
          encontrado: false,
          mensagem: dataNascimento
            ? "Não foi possível validar os dados informados."
            : "CPF não localizado como congressista neste congresso.",
        };
      }

      const idCongressista = this.toNumber(row.ID_CONGRESSISTA);
      const idCongressoRow = this.toNumber(row.ID_CONGRESSO);
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

      return {
        encontrado: true,
        mensagem: "Congressista localizado para este congresso.",
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
