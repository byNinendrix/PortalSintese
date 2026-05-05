import { Module } from "@nestjs/common";
import { ParceirosController } from "./controllers/parceiros.controller";
import { ParceirosService } from "./services/parceiros.service";

@Module({
  controllers: [ParceirosController],
  providers: [ParceirosService],
  exports: [ParceirosService]
})
export class ParceirosModule {}

