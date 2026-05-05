import { Controller, Get } from "@nestjs/common";
import { ParceirosService } from "../services/parceiros.service";

@Controller("parceiros")
export class ParceirosController {
  constructor(private readonly parceirosService: ParceirosService) {}

  @Get()
  findAll() {
    return this.parceirosService.findAll();
  }
}

