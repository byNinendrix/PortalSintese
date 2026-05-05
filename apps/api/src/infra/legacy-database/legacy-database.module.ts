import { Global, Module } from "@nestjs/common";
import { LegacyDatabaseService } from "./legacy-database.service";

@Global()
@Module({
  providers: [LegacyDatabaseService],
  exports: [LegacyDatabaseService]
})
export class LegacyDatabaseModule {}

