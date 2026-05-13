import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDataDto } from "../dto/update-user-data.dto";
import { UsersService } from "../services/users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("check-cpf")
  checkCpf(@Query("cpf") cpf?: string) {
    return this.usersService.checkCpfExists(cpf);
  }

  @Get("profile")
  getProfile(@Query("cpf") cpf?: string) {
    return this.usersService.getProfileByCpf(cpf);
  }

  @Get("filiacoes")
  getFiliacoes(@Query("cpf") cpf?: string) {
    return this.usersService.getFiliacoesByCpf(cpf);
  }

  @Get("protocolos")
  getProtocolos(@Query("cpf") cpf?: string) {
    return this.usersService.getProtocolosByCpf(cpf);
  }

  @Get("ficha-cadastral")
  getFichaCadastral(@Query("cpf") cpf?: string, @Query("usuario") usuario?: string) {
    return this.usersService.getFichaCadastralByCpf(cpf, usuario);
  }

  @Get("carteira")
  getCarteira(@Query("cpf") cpf?: string) {
    return this.usersService.prepareCarteiraByCpf(cpf);
  }

  @Get("atualizar-dados")
  getAtualizarDados(@Query("cpf") cpf?: string) {
    return this.usersService.getAtualizarDadosByCpf(cpf);
  }

  @Post("atualizar-dados")
  updateAtualizarDados(@Body() payload: UpdateUserDataDto) {
    return this.usersService.updateAtualizarDados(payload);
  }

  @Get("lookups/ufs")
  getLookupUfs() {
    return this.usersService.getLookupUfs();
  }

  @Get("lookups/generos")
  getLookupGeneros() {
    return this.usersService.getLookupGeneros();
  }

  @Get("lookups/estados-civis")
  getLookupEstadosCivis() {
    return this.usersService.getLookupEstadosCivis();
  }

  @Get("lookups/racas")
  getLookupRacas() {
    return this.usersService.getLookupRacas();
  }

  @Get("lookups/cidades")
  getLookupCidades(@Query("uf") uf?: string) {
    return this.usersService.getLookupCidades(uf);
  }

  @Get("lookups/fatores-sanguineos")
  getLookupFatoresSanguineos() {
    return this.usersService.getLookupFatoresSanguineos();
  }

  @Post()
  create(@Body() payload: CreateUserDto) {
    return this.usersService.create(payload);
  }
}
