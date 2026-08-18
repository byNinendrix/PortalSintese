import { Module } from "@nestjs/common";
import { CongressosController } from "./controllers/congressos.controller";
import { CongressosService } from "./services/congressos.service";

@Module({
  controllers: [CongressosController],
  providers: [CongressosService],
  exports: [CongressosService]
})
export class CongressosModule {}
