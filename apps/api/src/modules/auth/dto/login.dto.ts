import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

