import { Controller, Get, Query } from "@nestjs/common";
import { ConveniosService } from "../services/convenios.service";

@Controller("convenios")
export class ConveniosController {
  constructor(private readonly conveniosService: ConveniosService) {}

  @Get("ramo-atividade")
  listRamosAtividade() {
    return this.conveniosService.listRamosAtividade();
  }

  @Get()
  findAll(@Query("ramo") ramo?: string, @Query("parceiro") parceiro?: string) {
    return this.conveniosService.findAll({ ramo, parceiro });
  }
}
