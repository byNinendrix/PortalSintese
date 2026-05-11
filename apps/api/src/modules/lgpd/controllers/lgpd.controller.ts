import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AceitarLgpdDto } from "../dto/aceitar-lgpd.dto";
import { LgpdService } from "../services/lgpd.service";

@Controller(["lgpd", "auth/lgpd"])
export class LgpdController {
  constructor(private readonly lgpdService: LgpdService) {}

  @Get("termo")
  consultarTermo(@Query("cpf") cpf: string) {
    return this.lgpdService.consultarTermo(cpf);
  }

  @Post("aceitar")
  aceitarTermo(@Body() payload: AceitarLgpdDto) {
    return this.lgpdService.aceitarTermo(payload);
  }
}
