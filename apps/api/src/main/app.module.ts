import { Module } from "@nestjs/common";
import { LegacyDatabaseModule } from "../infra/legacy-database/legacy-database.module";
import { AuthModule } from "../modules/auth/auth.module";
import { ConveniosModule } from "../modules/convenios/convenios.module";
import { ParceirosModule } from "../modules/parceiros/parceiros.module";
import { UsersModule } from "../modules/users/users.module";

@Module({
  imports: [LegacyDatabaseModule, AuthModule, UsersModule, ConveniosModule, ParceirosModule]
})
export class AppModule {}
