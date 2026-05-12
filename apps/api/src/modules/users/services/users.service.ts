import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { LegacyDatabaseService } from "../../../infra/legacy-database/legacy-database.service";
import { renderPortalEmailTemplate } from "../../../shared/email/portal-email.template";
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
  QRCODE_FICHA?: string | null;
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

@Injectable()
export class UsersService {
  constructor(private readonly legacyDatabaseService: LegacyDatabaseService) {}

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

  private generateFirstPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const randomPart = (size: number) =>
      Array.from({ length: size })
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
    return `${randomPart(4)}-${randomPart(1)}`;
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
        qrCodeFicha: this.normalizeScalar(pessoa.QRCODE_FICHA),
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
