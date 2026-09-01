import { IsNotEmpty, IsString } from "class-validator";

export class CertificadoCongressistaDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  data_nascimento!: string;
}
