import { IsNotEmpty, IsString } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

