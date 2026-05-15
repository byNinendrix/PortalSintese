import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength
} from "class-validator";

export class CreateSolicitacaoFiliacaoDto {
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nomeSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pai?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mae?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  naturalidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  celular?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  celularIi?: string;

  @IsOptional()
  @IsString()
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  estadoCivil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  especificarGenero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  orientacaoSexual?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  sexo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  rg?: string;

  @IsOptional()
  @IsString()
  dataExpRg?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rgOrgao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  rgUf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sangueTpRh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  raca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  matriculaOrgao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoEmpresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  codigoPredio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nivelSalarialOrgao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  situacaoFuncional?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cargoOrgao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  funcaoOrgao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  profissaoOrgao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vinculoOrgao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cargaHorariaOrgao?: string;

  @IsOptional()
  @IsString()
  admissaoOrgao?: string;

  @IsOptional()
  @IsString()
  aposentadoriaOrgao?: string;

  @IsOptional()
  @IsBoolean()
  adicionarOutraFiliacao?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  matriculaOrgaoI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoEmpresaI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  codigoPredioI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nivelSalarialOrgaoI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  situacaoOrgaoI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cargoOrgaoI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  funcaoOrgaoI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  profissaoOrgaoI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vinculoOrgaoI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cargaHorariaOrgaoI?: string;

  @IsOptional()
  @IsString()
  admissaoOrgaoI?: string;

  @IsOptional()
  @IsString()
  aposentadoriaOrgaoI?: string;

  @IsOptional()
  @IsBoolean()
  autorizarDesconto?: boolean;

  @IsOptional()
  @IsBoolean()
  autorizarLgpd?: boolean;

  @IsOptional()
  @IsString()
  termoLgpd?: string;

  @IsOptional()
  @IsIn(["N", "S"])
  descontarInss?: "N" | "S";

  @IsOptional()
  @IsString()
  dataDescontoInss?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  numeroBeneficioInss?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoEspecieInss?: string;

  @IsOptional()
  @IsIn(["N", "S"])
  descontarInssI?: "N" | "S";

  @IsOptional()
  @IsString()
  dataDescontoInssI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  numeroBeneficioInssI?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoEspecieInssI?: string;

  @IsOptional()
  @IsString()
  fotoPerfilBase64?: string;

  @IsOptional()
  @IsString()
  fotoResidenciaBase64?: string;

  @IsOptional()
  @IsString()
  fotoContracheque01Base64?: string;

  @IsOptional()
  @IsString()
  fotoContracheque02Base64?: string;

  @IsOptional()
  @IsString()
  fotoDocumentoBase64?: string;

  @IsOptional()
  @IsString()
  fotoRgFrenteBase64?: string;

  @IsOptional()
  @IsString()
  fotoRgVersoBase64?: string;
}
