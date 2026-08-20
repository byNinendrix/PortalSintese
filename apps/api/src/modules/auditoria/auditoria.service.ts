import { Injectable, Logger } from "@nestjs/common";
import { LegacyDatabaseService } from "../../infra/legacy-database/legacy-database.service";

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly db: LegacyDatabaseService) {}

  async registrarAcao(motivo: string, cpf?: string | null): Promise<void> {
    const cpfNormalizado = this.normalizarCpf(cpf);
    const motivoSeguro = this.sanitizarMotivo(motivo);

    if (!motivoSeguro) {
      return;
    }

    try {
      await this.db.query(
        `INSERT INTO dbo.SYS_LOGS_APP (CPF, DATA_ACESSO, MOTIVO)
         VALUES (@cpf, GETDATE(), @motivo)`,
        {
          cpf: cpfNormalizado,
          motivo: motivoSeguro,
        }
      );
    } catch {
      this.logger.warn("Falha ao registrar acao de auditoria (ignorado).");
    }
  }

  private sanitizarMotivo(motivo: string): string | null {
    const limpo = motivo
      .replace(/[\r\n\t]+/g, " ")
      .replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1FFFF}]|[\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
      .replace(/[^\w\sÀ-ÿ/:.,;()\-!?@#&=+'"°ºª%$*\[\]{}|~^<>\\]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 500);

    return limpo.length > 0 ? limpo : null;
  }

  private normalizarCpf(cpf?: string | null): string | null {
    if (!cpf) {
      return null;
    }

    const digits = cpf.replace(/\D/g, "");

    if (digits.length !== 11) {
      return null;
    }

    return digits;
  }
}
