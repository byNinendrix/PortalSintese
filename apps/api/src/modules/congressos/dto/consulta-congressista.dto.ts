import { IsNotEmpty, IsString } from "class-validator";

export class ConsultaCongressistaDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  dataNascimento!: string;
}
