import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegistrarAcaoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  motivo!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/)
  cpf?: string;
}
