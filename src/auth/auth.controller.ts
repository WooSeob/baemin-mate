import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";
import { NaverAuthGuard } from "./guards/naver-auth.guard";
import { User } from "../user/entity/user.entity";

const CLIENT_ID = "qpKfX2QvHyoIFy_BPR_0";
const CALLBACK_URL = encodeURI("http://localhost:3000/auth/naver/callback");
const SERVICE_URL = "http://localhost:3000";
const CLIENT_SECRET = "8eUK60rAo3";
/**
 * oauth id
 *
 *  {
  access_token: 'AAAANv0ztj2fAvegwiDme2Xdd7b7tbqm0-1syFrlrCcDnF0Km8FbfvkSOxLoQWCpcwi8wU_E98nwzhPs7PO8-nPTCV4',
  refresh_token: '3S0iibYEMGcrMlF16Z83zZ22GcxBJcQR4JawgLWTZOeS3L2ETTxDMiiis13agskcWOPlVtdmyahevNFTtKr9H2yzg7isMOkfMpko0C95TVGii7KeajWd0LcNYtBJzwjjXlBwn',
  token_type: 'bearer',
  expires_in: '3600'
}

 * */
const STATE = "asdf";
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}
  @Get("/hello")
  async asdf() {
    const api_url =
      "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=" +
      CLIENT_ID +
      "&redirect_uri=" +
      CALLBACK_URL +
      "&state=" +
      STATE;

    return `<a href="${api_url}"><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>`;
  }

  private logger: Logger = new Logger("AuthController");

  @Get("/naver/callback")
  async cb(@Query("code") code, @Query("state") state) {
    console.log(code);
    console.log(state);
    const api_url = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${CALLBACK_URL}&code=${code}&state=${STATE}`;
    console.log(api_url);

    const res: AxiosResponse = await axios.get(api_url, {
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
      },
    });
    console.log(res.data);

    if (res.data.error) {
      throw new HttpException("에러발생", HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(NaverAuthGuard)
  @Get("/user")
  async getUser(@Req() request: Request) {
    const user = request.user as User;
    return { name: user.name };
  }

  @Post("/login")
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    console.log(loginDto);
    const ret = this.authService.login(loginDto);
    this.logger.log(loginDto);
    // if (!ret) {
    //   //로그인 실패
    //   return res.status(HttpStatus.UNAUTHORIZED).send();
    // }

    res.status(HttpStatus.OK).json({ sessionId: ret });
  }
  @Post("/logout")
  async logout(@Body() logoutDto: LogoutDto) {
    this.authService.logout(logoutDto);
  }
}
