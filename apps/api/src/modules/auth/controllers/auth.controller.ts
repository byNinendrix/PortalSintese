import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { LoginDto } from "../dto/login.dto";
import { RecoverPasswordDto } from "../dto/recover-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { SessionQueryDto } from "../dto/session-query.dto";
import { AuthService } from "../services/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Get("me/session")
  getSession(@Query() query: SessionQueryDto) {
    return this.authService.getSessionByCpf(query.cpf);
  }

  @Post("refresh-token")
  refreshToken(@Body() payload: RefreshTokenDto) {
    return this.authService.refreshToken(payload);
  }

  @Post("recover-password")
  recoverPassword(@Body() payload: RecoverPasswordDto) {
    return this.authService.recoverPassword(payload);
  }

  @Post("reset-password")
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }
}
