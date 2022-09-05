import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import axios, { AxiosResponse } from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../user/entity/user.entity";
import { Connection, QueryRunner, Repository } from "typeorm";
import { UserService } from "../user/user.service";
import { createTransport, Transporter } from "nodemailer";
import { UniversityEmailAuthEntity } from "./entity/university-email-auth.entity";
import { randomBytes } from "crypto";
import { EmailAuthConfig, jwt as jwtConfig } from "../../config";
import { v4 } from "uuid";
import { NaverAuthResponse } from "./interface/NaverAuthResponse";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from "nest-winston";

export interface AccessTokenPayload {
  id: string;
  name: string;
  univId: number;
}

interface RefreshTokenPayload {
  ats: string; //access token signature
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger("AuthService");
  private readonly _mailTransporter: Transporter;

  constructor(
    public connection: Connection,
    @InjectRepository(UniversityEmailAuthEntity)
    private emailAuthRepository: Repository<UniversityEmailAuthEntity>,
    private userService: UserService, //@Inject(forwardRef(() => UserService))
    private jwtService: JwtService
  ) {
    this._mailTransporter = createTransport(EmailAuthConfig.getAccount());
  }

  async validate(token: string): Promise<AccessTokenPayload> {
    //TODO 블랙리스트에 있는 토큰인지 검사
    try {
      const payload: AccessTokenPayload = this.jwtService.verify(token);
      return payload ? payload : undefined;
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }

  private extractSignature(token: string) {
    return token.split(".")[2];
  }
  async refreshToken(dto: RefreshTokenDto) {
    //TODO 블랙리스트에 있는 토큰인지 검사
    const refreshTokenPayload = this.jwtService.verify<RefreshTokenPayload>(
      dto.refreshToken
    );
    if (!refreshTokenPayload) {
      throw new UnauthorizedException("만료된 refresh token 입니다.");
    }

    const accessTokenSignature = this.extractSignature(dto.accessToken);
    if (refreshTokenPayload.ats !== accessTokenSignature) {
      throw new UnauthorizedException("변조된 refresh token 입니다.");
    }

    const userId: string = this.jwtService.decode(dto.accessToken)["id"];

    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException("존재하지 않는 회원입니다.");
    }

    return this.createAccessToken(user);
  }

  async getUserdataFromNaver(token: string): Promise<NaverAuthResponse> {
    try {
      let res: AxiosResponse;
      res = await axios.get("https://openapi.naver.com/v1/nid/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data.response;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  async login(userData: NaverAuthResponse) {
    const user = await this.userService.findUserByOauthId(userData.id);
    if (!user) {
      throw new NotFoundException(
        "존재하지 않는 회원입니다. 회원가입을 진행해 주세요."
      );
    }

    return this.createAccessToken(user);
  }

  async emailAuthCreate(oauthId: string, univId: number, email: string) {
    //TODO + 탈퇴후 재가입 처리
    //TODO + 재발급 요청 횟수 제한, 동시 요청 처리
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let emailAuth = await queryRunner.manager.findOne(
      UniversityEmailAuthEntity,
      {
        oauthId: oauthId,
      }
    );

    if (!emailAuth) {
      emailAuth = UniversityEmailAuthEntity.create(univId, oauthId, email);
    }

    if (emailAuth.isNotAvailable()) {
      throw new Error("너무 많이 시도했습니다.");
    }

    try {
      const AuthCode = this._generateAuthCode();
      await this._mailTransporter.sendMail(
        this._createEmailMessage(email, AuthCode)
      );
      emailAuth.try(univId, email, AuthCode);
      await queryRunner.manager.save(emailAuth);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private _createEmailMessage(to: string, authCode: string) {
    return {
      // 보내는 곳의 이름과, 메일 주소를 입력
      from: EmailAuthConfig.content.from,
      // 받는 곳의 메일 주소를 입력
      to: to,
      // 보내는 메일의 제목을 입력
      subject: EmailAuthConfig.content.subject,
      // 보내는 메일의 내용을 입력
      text: authCode,
      html: `<h1>${authCode}</h1>`,
    };
  }

  async emailAuthVerify(userdata: NaverAuthResponse, authCode: string) {
    //TODO + 시도횟수 제한
    //TODO ? 여러번 인증 요청하면
    const authInfo = await this.emailAuthRepository.findOne({
      oauthId: userdata.id,
    });
    //auth info 없음
    if (!authInfo) {
      throw new HttpException("인증 정보가 없습니다.", HttpStatus.NOT_FOUND);
    }
    //3분 경과
    if (Date.now() - authInfo.updatedAt > 3 * 60 * 1000) {
      throw new HttpException("만료된 인증입니다.", HttpStatus.BAD_REQUEST);
    }
    //코드 불일치
    if (authInfo.authCode != authCode) {
      throw new HttpException(
        "인증 번호가 일치하지 않습니다.",
        HttpStatus.BAD_REQUEST
      );
    }
    //TODO 리팩토링
    await this.userService.createUserByNaver(
      userdata.id,
      userdata.name,
      authInfo.universityId
    );
  }

  private async createAccessToken(user: UserEntity) {
    const payload: AccessTokenPayload = {
      name: user.name,
      id: user.id,
      univId: user.universityId,
    };
    const accessToken = this.jwtService.sign(payload);

    const refreshTokenPayload: RefreshTokenPayload = {
      ats: this.extractSignature(accessToken),
    };

    return {
      accessToken: accessToken,
      refreshToken: this.jwtService.sign(refreshTokenPayload, {
        expiresIn: jwtConfig.refreshTokenExpIn,
      }),
    };
  }

  private _generateAuthCode(): string {
    return String(parseInt(randomBytes(2).toString("hex"), 16));
  }
}
