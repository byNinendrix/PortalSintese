import { IsInt, IsNotEmpty, IsString, Matches, Min } from "class-validator";

export class CarimbarPresencaDto {
  @IsInt()
  @Min(1)
  id_congressista!: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  data_palestra!: string;

  @IsString()
  @IsNotEmpty()
  usuario!: string;

  @IsString()
  @IsNotEmpty()
  senha!: string;
}
