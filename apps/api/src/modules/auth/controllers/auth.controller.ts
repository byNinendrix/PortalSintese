import { Body, Controller, Post } from "@nestjs/common";
import { LoginDto } from "../dto/login.dto";
import { RecoverPasswordDto } from "../dto/recover-password.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { AuthService } from "../services/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post("refresh-token")
  refreshToken(@Body() payload: RefreshTokenDto) {
    return this.authService.refreshToken(payload);
  }

  @Post("recover-password")
  recoverPassword(@Body() payload: RecoverPasswordDto) {
    return this.authService.recoverPassword(payload);
  }
}
