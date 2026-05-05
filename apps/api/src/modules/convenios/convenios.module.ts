import { Module } from "@nestjs/common";
import { ConveniosController } from "./controllers/convenios.controller";
import { ConveniosService } from "./services/convenios.service";

@Module({
  controllers: [ConveniosController],
  providers: [ConveniosService],
  exports: [ConveniosService]
})
export class ConveniosModule {}

