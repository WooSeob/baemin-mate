import { Body, Controller, Get, HttpStatus, Logger, Post, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}
  @Get("/hello")
  async asdf() {
    return "hello";
  }

  private logger: Logger = new Logger("AuthController");

  @Post("/login")
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    console.log(loginDto);
    const ret = this.authService.login(loginDto);
    this.logger.log(loginDto);
    if (!ret) {
      //로그인 실패
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    res.status(HttpStatus.OK).json({ sessionId: ret });
  }
  @Post("/logout")
  async logout(@Body() logoutDto: LogoutDto) {
    this.authService.logout(logoutDto);
  }
}
