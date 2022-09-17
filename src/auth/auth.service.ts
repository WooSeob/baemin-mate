import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UserEntity } from "../user/entity/user.entity";
import { Connection } from "typeorm";
import { UserService } from "../user/user.service";
import { createTransport, Transporter } from "nodemailer";
import { EmailAuthConfig, jwt as jwtConfig } from "../../config";
import { NaverAuthResponse } from "./interface/NaverAuthResponse";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

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

  async login(oauthId: string) {
    const user = await this.userService.findUserByOauthId(oauthId);
    if (!user) {
      throw new NotFoundException(
        "존재하지 않는 회원입니다. 회원가입을 진행해 주세요."
      );
    }

    return this.createAccessToken(user);
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
}
