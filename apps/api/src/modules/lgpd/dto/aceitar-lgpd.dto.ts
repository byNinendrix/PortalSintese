import { IsNotEmpty, IsString } from "class-validator";

export class AceitarLgpdDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;
}

