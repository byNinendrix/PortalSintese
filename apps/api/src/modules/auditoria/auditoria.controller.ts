import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuditoriaService } from "./auditoria.service";
import { RegistrarAcaoDto } from "./dto/registrar-acao.dto";

@Controller("auditoria")
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post("acao")
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrarAcao(@Body() dto: RegistrarAcaoDto): Promise<void> {
    await this.auditoriaService.registrarAcao(dto.motivo, dto.cpf);
  }
}
