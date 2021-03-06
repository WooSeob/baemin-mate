import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";
import { UserEntity } from "../user/entity/user.entity";
import { SendCodeDto } from "./dto/send-code.dto";
import { VerifyCodeDto } from "./dto/verify-code.dto";
import { ApiBearerAuth, ApiCreatedResponse } from "@nestjs/swagger";
import { UniversityService } from "../university/university.service";
import { JwtAuthGuard } from "./guards/JwtAuthGuard";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { NotificationService } from "../notification/notification.service";
import { TokenResponseDto } from "./dto/response/token.response.dto";
import { UserService } from "../user/user.service";
import { NaverOAuthConfig } from "../../config";

const CLIENT_ID = NaverOAuthConfig.CLIENT_ID;
const CALLBACK_URL = encodeURI(NaverOAuthConfig.CALLBACK_URL);
const SERVICE_URL = NaverOAuthConfig.SERVICE_URL;
const CLIENT_SECRET = NaverOAuthConfig.CLIENT_SECRET;

const STATE = "asdf";
@Controller("auth")
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private universityService: UniversityService,
    private notificationService: NotificationService
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
      throw new HttpException("????????????", HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/user")
  async getUser(@Req() request: Request) {
    return request.user;
  }

  @Post("/token")
  @ApiCreatedResponse({
    description:
      "oauth access token??? ????????? ???????????? ????????? ??????????????????.\ndeviceToken ????????? ??????????????????, ?????? ???????????? ???????????? ?????? ????????? fcm device token ????????? ????????? ?????? ???????????????.",
    type: TokenResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    const userData = await this.authService.getUserdataFromNaver(
      loginDto.accessToken
    );

    if (!userData) {
      throw new UnauthorizedException("????????? ???????????????.");
    }

    this.logger.log(userData);
    if (loginDto.deviceToken) {
      const user = await this.userService.findUserByOauthId(userData.id);
      if (!user) {
        throw new NotFoundException(
          "???????????? ?????? ???????????????. ??????????????? ????????? ?????????."
        );
      }
      await this.notificationService.put(user.id, loginDto.deviceToken);
    }

    return this.authService.login(userData);
  }

  @Patch("/token")
  @ApiCreatedResponse({
    description:
      "???????????? access token??? refresh token?????? ????????? ???????????? ??????????????????.",
    type: TokenResponseDto,
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Post("/token/blacklist")
  async logout(@Param("id") sessionId: string) {
    throw new NotImplementedException("???????????? ???????????????.");
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
      throw new HttpException("????????? ?????? ?????????.", HttpStatus.UNAUTHORIZED);
    }

    const univ = await this.universityService.getUniversityById(
      sendCodeDto.universityId
    );

    if (!univ) {
      throw new NotFoundException("?????? ????????? ?????? ??? ????????????.");
    }

    // @ ???????????? ????????????
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
      throw new HttpException("????????? ?????? ?????????.", HttpStatus.UNAUTHORIZED);
    }
    await this.authService.emailAuthVerify(userdata, verifyCodeDto.authCode);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/email/verified")
  async getIsEmailVerified(@Req() request: Request) {
    const user = request.user as UserEntity;
    return user.verified;
  }
}
