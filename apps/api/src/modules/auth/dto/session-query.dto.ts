import { IsNotEmpty, IsString } from "class-validator";

export class SessionQueryDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;
}

