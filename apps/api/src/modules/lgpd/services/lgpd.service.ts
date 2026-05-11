import { BadRequestException, Injectable } from "@nestjs/common";
import { LegacyDatabaseService } from "../../../infra/legacy-database/legacy-database.service";
import { AceitarLgpdDto } from "../dto/aceitar-lgpd.dto";

interface PessoaRow {
  CPF: string;
  NOME?: string | null;
  AUTORIZA_LGPD?: string | number | boolean | null;
}

interface SindicatoRow {
  TERMO_LGPD?: string | null;
}

@Injectable()
export class LgpdService {
  constructor(private readonly legacyDatabaseService: LegacyDatabaseService) {}

  private sanitizeCpf(cpf: string): string {
    return cpf.replace(/\D/g, "");
  }

  private maskCpf(cpfDigits: string): string {
    if (cpfDigits.length !== 11) {
      return cpfDigits;
    }
    return `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`;
  }

  private toBoolean(value: PessoaRow["AUTORIZA_LGPD"]): boolean {
    if (typeof value === "boolean") {
      return value;
    }
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "s" || normalized === "sim";
  }

  async consultarTermo(cpf: string) {
    const cpfDigits = this.sanitizeCpf(cpf);
    if (!cpfDigits) {
      throw new BadRequestException("CPF é obrigatório.");
    }

    const pessoas = await this.legacyDatabaseService.query<PessoaRow>(
      `
      Select Top 1
        CPF,
        NOME,
        AUTORIZA_LGPD
      From
        PESSOAS
      Where
        CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (pessoas.length === 0) {
      throw new BadRequestException("Pessoa não encontrada para o CPF informado.");
    }

    const sindicato = await this.legacyDatabaseService.query<SindicatoRow>(
      `
      Select Top 1
        TERMO_LGPD
      From
        SINDICATO
      `
    );

    const pessoa = pessoas[0];
    const termo = sindicato[0]?.TERMO_LGPD?.trim() ?? "";

    return {
      cpf: this.maskCpf(cpfDigits),
      nome: pessoa.NOME?.trim() ?? "",
      termo,
      autorizaLgpd: this.toBoolean(pessoa.AUTORIZA_LGPD)
    };
  }

  async aceitarTermo(payload: AceitarLgpdDto) {
    const cpfDigits = this.sanitizeCpf(payload.cpf);
    if (!cpfDigits) {
      throw new BadRequestException("CPF é obrigatório.");
    }

    const pessoas = await this.legacyDatabaseService.query<PessoaRow>(
      `
      Select Top 1
        CPF
      From
        PESSOAS
      Where
        CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    if (pessoas.length === 0) {
      throw new BadRequestException("Pessoa não encontrada para o CPF informado.");
    }

    await this.legacyDatabaseService.query(
      `
      Update PESSOAS
      Set AUTORIZA_LGPD = 1
      Where CPF = @CPF
      `,
      { CPF: cpfDigits }
    );

    return {
      success: true,
      message: "A aceitação dos termos da L.G.P.D já foi registrada com sucesso! Obrigado por sua conformidade!"
    };
  }
}

