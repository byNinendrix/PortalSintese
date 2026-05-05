import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreateUserDto } from "../dto/create-user.dto";
import { UsersService } from "../services/users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("check-cpf")
  checkCpf(@Query("cpf") cpf?: string) {
    return this.usersService.checkCpfExists(cpf);
  }

  @Post()
  create(@Body() payload: CreateUserDto) {
    return this.usersService.create(payload);
  }
}
