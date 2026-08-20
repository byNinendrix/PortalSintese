import { Module } from "@nestjs/common";
import { AuditoriaModule } from "../auditoria/auditoria.module";
import { CongressosController } from "./controllers/congressos.controller";
import { CongressosService } from "./services/congressos.service";

@Module({
  imports: [AuditoriaModule],
  controllers: [CongressosController],
  providers: [CongressosService],
  exports: [CongressosService]
})
export class CongressosModule {}
