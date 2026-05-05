import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { LegacyDatabaseService } from "../../../infra/legacy-database/legacy-database.service";
import { renderPortalEmailTemplate } from "../../../shared/email/portal-email.template";
import { CreateUserDto } from "../dto/create-user.dto";

interface PessoaLoginRow {
  CPF: string;
  EMAIL?: string | null;
  WHATSAPP?: string | null;
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

  private isAutenticacaoEnabled(value: SindicatoMailSettingsRow["AUTENTICACAO"]): boolean {
    if (typeof value === "boolean") {
      return value;
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
