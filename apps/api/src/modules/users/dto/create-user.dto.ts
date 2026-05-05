import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength, ValidateIf } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ValidateIf((dto: CreateUserDto) => dto.preferredChannel === "email")
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ValidateIf((dto: CreateUserDto) => dto.preferredChannel === "whatsapp")
  @IsString()
  @IsNotEmpty()
  whatsapp?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(["email", "whatsapp"])
  preferredChannel!: "email" | "whatsapp";

  @IsString()
  @MinLength(8)
  password!: string;
}
