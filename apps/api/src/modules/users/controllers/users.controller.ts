import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { CreateSolicitacaoFiliacaoDto } from "../dto/create-solicitacao-filiacao.dto";
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

  @Get("regencia-classe")
  getRegenciaClasse(@Query("cpf") cpf?: string) {
    return this.usersService.getRegenciaClasseByCpf(cpf);
  }

  @Get("solicitar-filiacao")
  getSolicitarFiliacao(@Query("cpf") cpf?: string) {
    return this.usersService.getSolicitarFiliacaoByCpf(cpf);
  }

  @Post("solicitar-filiacao")
  createSolicitarFiliacao(@Body() payload: CreateSolicitacaoFiliacaoDto, @Req() request?: { ip?: string }) {
    return this.usersService.createSolicitarFiliacao(payload, request?.ip);
  }

  @Get("protocolos/relatorio")
  getProtocoloRelatorio(@Query("protocolo") protocolo?: string, @Query("cpf") cpf?: string) {
    return this.usersService.getProtocoloRelatorio(protocolo, cpf);
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

  @Get("lookups/filiacao-vinculos")
  getLookupFiliacaoVinculos() {
    return this.usersService.getLookupFiliacaoVinculos();
  }

  @Post()
  create(@Body() payload: CreateUserDto) {
    return this.usersService.create(payload);
  }
}
