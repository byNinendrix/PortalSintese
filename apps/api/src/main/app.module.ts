import { Module } from "@nestjs/common";
import { CongressosModule } from "../modules/congressos/congressos.module";
import { LegacyDatabaseModule } from "../infra/legacy-database/legacy-database.module";
import { AuthModule } from "../modules/auth/auth.module";
import { ConveniosModule } from "../modules/convenios/convenios.module";
import { LgpdModule } from "../modules/lgpd/lgpd.module";
import { ParceirosModule } from "../modules/parceiros/parceiros.module";
import { AuditoriaModule } from "../modules/auditoria/auditoria.module";
import { UsersModule } from "../modules/users/users.module";

@Module({
  imports: [LegacyDatabaseModule, AuthModule, UsersModule, ConveniosModule, ParceirosModule, LgpdModule, CongressosModule, AuditoriaModule]
})
export class AppModule {}
