import { Controller, Get, Query } from "@nestjs/common";
import { CongressosService } from "../services/congressos.service";

@Controller("congressos")
export class CongressosController {
  constructor(private readonly congressosService: CongressosService) {}

  @Get("ativo")
  findAtivo() {
    return this.congressosService.findAtivo();
  }

  @Get("ativo/congressista")
  findCongressistaAtivo(@Query("cpf") cpf?: string) {
    return this.congressosService.findCongressistaAtivo(cpf);
  }
}
