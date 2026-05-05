import { IsEmail, IsIn, IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class RecoverPasswordDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsString()
  @IsIn(["email", "whatsapp"])
  preferredChannel!: "email" | "whatsapp";

  @ValidateIf((dto: RecoverPasswordDto) => dto.preferredChannel === "email")
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ValidateIf((dto: RecoverPasswordDto) => dto.preferredChannel === "whatsapp")
  @IsString()
  @IsNotEmpty()
  whatsapp?: string;
}
