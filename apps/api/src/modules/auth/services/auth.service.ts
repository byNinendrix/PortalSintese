import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import * as nodemailer from "nodemailer";
import { LegacyDatabaseService } from "../../../infra/legacy-database/legacy-database.service";
import { AuditoriaService } from "../../auditoria/auditoria.service";
import { renderPortalEmailTemplate } from "../../../shared/email/portal-email.template";
import { LoginDto } from "../dto/login.dto";
import { RecoverPasswordDto } from "../dto/recover-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";

interface PessoaLoginRow {
  CPF: string;
  SENHA?: string | null;
  EMAIL?: string | null;
  WHATSAPP?: string | null;
}

interface FiliacaoAtivaRow {
  CPF: string;
  ASSOCIADO?: string | number | boolean | Date | Buffer | null;
  MODELO_CARTEIRA?: string | number | boolean | Date | Buffer | null;
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

interface FiliacaoAtivaSnapshot {
  isFiliadoAtivo: boolean;
  associado: string | null;
  modeloCarteira: string | null;
}

interface PessoaLgpdRow {
  CPF: string;
  AUTORIZA_LGPD?: string | number | boolean | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly legacyDatabaseService: LegacyDatabaseService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

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

  private normalizeEmail(email?: string): string | null {
    if (!email) {
      return null;
    }
    const normalized = email.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isPasswordComplex(password: string): boolean {
    return /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
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

  private generatePassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const randomPart = (size: number) =>
      Array.from({ length: size })
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
    return `${randomPart(4)}-${randomPart(1)}`;
  }

  private generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  private normalizeNullableScalar(value: string | number | boolean | Date | Buffer | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
      const text = value.toString("utf8").trim();
      return text.length > 0 ? text : null;
    }

    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }

  private toBoolean(value: PessoaLgpdRow["AUTORIZA_LGPD"]): boolean {
    if (typeof value === "boolean") {
      return value;
    }
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "s" || normalized === "sim";
  }

  private async shouldSuggestLgpd(cpfDigits: string): Promise<boolean> {
    const rows = await this.legacyDatabaseService.query<PessoaLgpdRow>(
      `
      Select Top 1
        CPF,
        AUTORIZA_LGPD
      From
        PESSOAS
      Where
        CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (rows.length === 0) {
      return false;
    }

    return !this.toBoolean(rows[0].AUTORIZA_LGPD);
  }

  private async getFiliacaoAtivaSnapshot(cpfDigits: string): Promise<FiliacaoAtivaSnapshot> {
    const filiacaoAtivaRows = await this.legacyDatabaseService.query<FiliacaoAtivaRow>(
      `
      Select Top 1
        FILIADO.CPF,
        FILIADO.ASSOCIADO,
        PESSOAS.MODELO_CARTEIRA
      From
        FILIADO
        Inner Join
        PESSOAS On FILIADO.CPF = PESSOAS.CPF
      Where
        FILIADO.CPF = @CPF
        And FILIADO.ASSOCIADO = -1
      `,
      { CPF: cpfDigits }
    );

    const filiacaoAtiva = filiacaoAtivaRows[0];
    return {
      isFiliadoAtivo: filiacaoAtivaRows.length > 0,
      associado: this.normalizeNullableScalar(filiacaoAtiva?.ASSOCIADO),
      modeloCarteira: this.normalizeNullableScalar(filiacaoAtiva?.MODELO_CARTEIRA)
    };
  }

  private maskCpfForEmail(cpfDigits: string): string {
    if (cpfDigits.length !== 11) {
      return cpfDigits;
    }
    return `***.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-**`;
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

  private logWhatsappRecoveredPasswordAudit(payload: {
    cpf: string;
    number: string;
    endpoint: string;
    event: "attempt" | "success" | "error";
    detail?: string;
  }): void {
    const maskedCpf = this.maskCpfForWhatsapp(payload.cpf);
    const maskedNumber = payload.number.length >= 4 ? `***${payload.number.slice(-4)}` : "***";
    const endpointHost = this.resolveWhatsappEndpointHost(payload.endpoint);
    const baseMessage = `[AUDIT][WHATSAPP_RECOVER_PASSWORD] event=${payload.event} cpf=${maskedCpf} number=${maskedNumber} endpoint=${endpointHost}`;

    if (payload.event === "error") {
      this.logger.error(`${baseMessage}${payload.detail ? ` detail=${payload.detail}` : ""}`);
      return;
    }

    this.logger.log(`${baseMessage}${payload.detail ? ` detail=${payload.detail}` : ""}`);
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

  private async sendRecoveredPasswordEmail(payload: { to: string; cpf: string; password: string }) {
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

    const text = `Sr(a).: ${maskedCpf}
Segue conforme solicitado sua nova senha de acesso ao portal do(a) filiado(a): ${payload.password}

Por favor, altere a senha assim que possível para garantir a segurança do seu acesso.`;

    const html = renderPortalEmailTemplate({
      title: "Redefinição de senha",
      subtitle: "Nova senha de acesso",
      tone: "info",
      identificationLabel: "Identificação",
      identificationValue: `CPF: ${maskedCpf}`,
      contentHtml: `
        <p style="margin:0 0 12px 0;">Sr(a).: <strong>${maskedCpf}</strong></p>
        <p style="margin:0 0 12px 0;">
          Segue conforme solicitado sua nova senha de acesso ao portal do(a) filiado(a):
          <span style="display:inline-block;background:#111827;color:#ffffff;padding:5px 12px;border-radius:8px;font-weight:700;letter-spacing:0.04em;">
            ${payload.password}
          </span>
        </p>
        <p style="margin:0;">Por favor, altere a senha assim que possível para garantir a segurança do seu acesso.</p>
      `,
      footerText: "Portal do Filiad@ | SINTESE"
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: payload.to,
      subject: "Portal do Filiad@ | Sua nova senha de acesso",
      text,
      html
    });
  }

  private async sendRecoveredPasswordWhatsapp(payload: {
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
      `Segue conforme solicitado sua nova senha de acesso ao portal do(a) filiado(a): ${payload.password}`,
      "Por favor, altere a senha assim que possivel para garantir a seguranca do seu acesso."
    ].join("\n");

    this.logWhatsappRecoveredPasswordAudit({
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
      this.logWhatsappRecoveredPasswordAudit({
        cpf: payload.cpf,
        number,
        endpoint,
        event: "error",
        detail
      });
      throw new InternalServerErrorException("Nao foi possivel enviar a nova senha via WhatsApp.");
    }

    if (!response.ok) {
      this.logWhatsappRecoveredPasswordAudit({
        cpf: payload.cpf,
        number,
        endpoint,
        event: "error",
        detail: `status=${response.status}`
      });
      throw new InternalServerErrorException("Nao foi possivel enviar a nova senha via WhatsApp.");
    }

    this.logWhatsappRecoveredPasswordAudit({
      cpf: payload.cpf,
      number,
      endpoint,
      event: "success",
      detail: `status=${response.status}`
    });
  }

  async login(payload: LoginDto) {
    const cpfDigits = this.sanitizeCpf(payload.cpf);
    const password = payload.password?.trim();

    if (!cpfDigits) {
      throw new BadRequestException("CPF é obrigatório.");
    }

    if (!password) {
      throw new BadRequestException("Senha é obrigatória.");
    }

    const rows = await this.legacyDatabaseService.query<PessoaLoginRow>(
      `
      Select Top 1
        CPF,
        SENHA
      From
        PESSOAS_LOGIN
      Where
        CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (rows.length === 0) {
      throw new BadRequestException("CPF ou senha inválidos.");
    }

    const storedPassword = rows[0].SENHA?.trim() ?? "";
    if (!storedPassword || storedPassword !== password) {
      throw new BadRequestException("CPF ou senha inválidos.");
    }

    const filiacaoAtiva = await this.getFiliacaoAtivaSnapshot(cpfDigits);
    const sugerirLgpd = await this.shouldSuggestLgpd(cpfDigits);

    return {
      cpf: cpfDigits,
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresIn: 900,
      isFiliadoAtivo: filiacaoAtiva.isFiliadoAtivo,
      associado: filiacaoAtiva.associado,
      modeloCarteira: filiacaoAtiva.modeloCarteira,
      sugerirLgpd
    };
  }

  async getSessionByCpf(cpf: string) {
    const cpfDigits = this.sanitizeCpf(cpf);
    if (cpfDigits.length !== 11) {
      throw new BadRequestException("CPF inválido.");
    }

    const session = await this.getFiliacaoAtivaSnapshot(cpfDigits);
    return {
      cpf: cpfDigits,
      isFiliadoAtivo: session.isFiliadoAtivo,
      associado: session.associado,
      modeloCarteira: session.modeloCarteira,
      checkedAt: new Date().toISOString()
    };
  }

  async refreshToken(_payload: RefreshTokenDto) {
    return {
      message: "Refresh-token endpoint scaffolded. Token rotation strategy pending security validation."
    };
  }

  async recoverPassword(payload: RecoverPasswordDto) {
    const cpfDigits = this.sanitizeCpf(payload.cpf);
    if (!cpfDigits) {
      throw new BadRequestException("CPF é obrigatório.");
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
      throw new BadRequestException("O CPF informado não foi localizado em nosso sistema.");
    }

    const user = rows[0];
    const dbEmail = this.normalizeEmail(user.EMAIL ?? "");
    const dbWhatsapp = this.sanitizePhone(user.WHATSAPP ?? "");

    if (payload.preferredChannel === "email") {
      const email = this.normalizeEmail(payload.email);
      if (!email) {
        throw new BadRequestException("E-mail é obrigatório.");
      }
      if (!this.isEmailValid(email)) {
        throw new BadRequestException("E-mail inválido.");
      }
      if (!dbEmail) {
        throw new BadRequestException("Não existe e-mail cadastrado para este CPF.");
      }
      if (dbEmail !== email) {
        throw new BadRequestException("O e-mail informado não confere com o cadastro.");
      }
    }

    if (payload.preferredChannel === "whatsapp") {
      const whatsapp = this.sanitizePhone(payload.whatsapp);
      if (!whatsapp) {
        throw new BadRequestException("Número de WhatsApp é obrigatório.");
      }
      if (!dbWhatsapp) {
        throw new BadRequestException("Não existe WhatsApp cadastrado para este CPF.");
      }
      if (dbWhatsapp !== whatsapp) {
        throw new BadRequestException("O número de WhatsApp informado não confere com o cadastro.");
      }
    }

    const newPassword = this.generatePassword();
    await this.legacyDatabaseService.query(
      `
      Update PESSOAS_LOGIN
      Set SENHA = @SENHA
      Where CPF = @CPF
      `,
      {
        CPF: cpfDigits,
        SENHA: newPassword
      }
    );

    if (payload.preferredChannel === "email" && dbEmail) {
      await this.sendRecoveredPasswordEmail({
        to: dbEmail,
        cpf: cpfDigits,
        password: newPassword
      });
    }

    if (payload.preferredChannel === "whatsapp" && dbWhatsapp) {
      await this.sendRecoveredPasswordWhatsapp({
        cpf: cpfDigits,
        whatsapp: dbWhatsapp,
        password: newPassword
      });
    }

    const canalMotivo = payload.preferredChannel === "email" ? "por email" : "por whatsapp";
    void this.auditoriaService.registrarAcao(
      `Recuperacao de senha solicitada ${canalMotivo}`,
      cpfDigits,
    );

    return {
      success: true,
      message:
        payload.preferredChannel === "email"
          ? "Senha redefinida com sucesso. Enviamos a nova senha para o e-mail cadastrado."
          : "Senha redefinida com sucesso. Enviamos a nova senha para o WhatsApp cadastrado."
    };
  }

  async resetPassword(payload: ResetPasswordDto) {
    const cpfDigits = this.sanitizeCpf(payload.cpf);
    const newPassword = payload.newPassword?.trim() ?? "";

    if (!cpfDigits) {
      throw new BadRequestException("CPF é obrigatório.");
    }

    if (!newPassword) {
      throw new BadRequestException("Nova senha é obrigatória.");
    }

    if (!this.isPasswordComplex(newPassword)) {
      throw new BadRequestException(
        "A senha deve ter no mínimo 6 caracteres, com pelo menos 1 letra maiúscula e 1 número."
      );
    }

    const rows = await this.legacyDatabaseService.query<PessoaLoginRow>(
      `
      Select Top 1
        CPF
      From
        PESSOAS_LOGIN
      Where
        CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (rows.length === 0) {
      throw new BadRequestException("Usuário não encontrado para redefinição de senha.");
    }

    await this.legacyDatabaseService.query(
      `
      Update PESSOAS_LOGIN
      Set SENHA = @SENHA
      Where CPF = @CPF
      `,
      {
        CPF: cpfDigits,
        SENHA: newPassword
      }
    );

    void this.auditoriaService.registrarAcao(
      "Redefinicao de senha realizada",
      cpfDigits,
    );

    return {
      success: true,
      message: "Senha atualizada com sucesso."
    };
  }
}

