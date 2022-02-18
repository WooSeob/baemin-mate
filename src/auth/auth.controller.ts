import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
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
import { User } from "../user/entity/user.entity";
import { SendCodeDto } from "./dto/send-code.dto";
import { VerifyCodeDto } from "./dto/verify-code.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { SessionAuthGuard } from "./guards/SessionAuthGuard";
import { UniversityService } from "../university/university.service";

const CLIENT_ID = "qpKfX2QvHyoIFy_BPR_0";
const CALLBACK_URL = encodeURI("http://localhost:3000/auth/naver/callback");
const SERVICE_URL = "http://localhost:3000";
const CLIENT_SECRET = "8eUK60rAo3";

const STATE = "asdf";
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private universityService: UniversityService
  ) {}
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

  @UseGuards(SessionAuthGuard)
  @Get("/user")
  async getUser(@Req() request: Request) {
    const user = request.user as User;
    return { name: user.name, id: user.id };
  }

  @Post("/session")
  async login(@Body() loginDto: LoginDto) {
    console.log(loginDto);
    return { sessionId: await this.authService.login(loginDto) };
  }

  @Delete("/session/:id")
  async logout(@Param("id") sessionId: string) {
    console.log("adsf");
    this.authService.logout({ sessionId: sessionId });
  }

  @Post("/email/send")
  async sendVerifyEmail(
    @Req() request: Request,
    @Body() sendCodeDto: SendCodeDto
  ) {
    const userdata = await this.authService.getUserdataFromNaver(
      sendCodeDto.oauthAccessToken
    );
    if (!userdata) {
      throw new HttpException("잘못된 토큰 입니다.", HttpStatus.UNAUTHORIZED);
    }

    const univ = await this.universityService.getUniversityById(
      sendCodeDto.universityId
    );

    if (!univ) {
      throw new NotFoundException("해당 대학을 찾을 수 없습니다.");
    }

    // @ 포함이면 걸러내기
    if (sendCodeDto.email.split("@").length > 0) {
      sendCodeDto.email = sendCodeDto.email.split("@")[0];
    }
    const emailAddress = `${sendCodeDto.email}@${univ.emailDomain}`;

    await this.authService.emailAuthCreate(userdata.id, univ.id, emailAddress);
  }

  @Post("/email/verify")
  async verifyAuthCode(
    @Req() request: Request,
    @Body() verifyCodeDto: VerifyCodeDto
  ) {
    const userdata = await this.authService.getUserdataFromNaver(
      verifyCodeDto.oauthAccessToken
    );
    if (!userdata) {
      throw new HttpException("잘못된 토큰 입니다.", HttpStatus.UNAUTHORIZED);
    }
    await this.authService.emailAuthVerify(userdata, verifyCodeDto.authCode);
  }

  @UseGuards(SessionAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/email/verified")
  async getIsEmailVerified(@Req() request: Request) {
    const user = request.user as User;
    return user.verified;
  }
}
