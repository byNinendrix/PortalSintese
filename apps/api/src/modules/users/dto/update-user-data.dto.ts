import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateUserDataDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  sangueTpRh?: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  dataExpRg?: string;

  @IsOptional()
  @IsString()
  rgOrgao?: string;

  @IsOptional()
  @IsString()
  rgUf?: string;

  @IsOptional()
  @IsString()
  nomeSocial?: string;

  @IsOptional()
  @IsString()
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  sexo?: string;

  @IsOptional()
  @IsString()
  especificarGenero?: string;

  @IsOptional()
  @IsString()
  orientacaoSexual?: string;

  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @IsOptional()
  @IsString()
  raca?: string;

  @IsOptional()
  @IsString()
  mae?: string;

  @IsOptional()
  @IsString()
  pai?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsString()
  celularIi?: string;

  @IsOptional()
  @IsString()
  cepAcr?: string;

  @IsOptional()
  @IsString()
  enderecoAcr?: string;

  @IsOptional()
  @IsString()
  numeroAcr?: string;

  @IsOptional()
  @IsString()
  bairroAcr?: string;

  @IsOptional()
  @IsString()
  complementoAcr?: string;

  @IsOptional()
  @IsString()
  estadoAcr?: string;

  @IsOptional()
  @IsString()
  cidadeAcr?: string;

  @IsOptional()
  @IsString()
  fotoPerfilBase64?: string;

  @IsOptional()
  @IsBoolean()
  confirmarSubstituicaoSolicitacaoEndereco?: boolean;
}
