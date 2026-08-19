import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ConsultaCongressistaDto } from "../dto/consulta-congressista.dto";
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

  @Post("ativo/congressista/consulta")
  findCongressistaAtivoSeguro(@Body() body: ConsultaCongressistaDto) {
    return this.congressosService.findCongressistaAtivoSeguro(body);
  }
}
