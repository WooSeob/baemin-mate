import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import axios, { AxiosResponse } from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../user/entity/user.entity";
import { Connection, QueryRunner, Repository } from "typeorm";
import { UserService } from "../user/user.service";
import { createTransport, Transporter } from "nodemailer";
import { UniversityEmailAuth } from "./entity/UniversityEmailAuth";
import { randomBytes } from "crypto";
import { EmailAuthConfig } from "../../config";
import { v4 } from "uuid";
import { NaverAuthResponse } from "./interface/NaverAuthResponse";
import { Session } from "./entity/Session";

@Injectable()
export class AuthService {
  private readonly _mailTransporter: Transporter;

  constructor(
    public connection: Connection,
    @InjectRepository(UniversityEmailAuth)
    private emailAuthRepository: Repository<UniversityEmailAuth>,
    @InjectRepository(Session) private sessionRepository: Repository<Session>,
    private userService: UserService //@Inject(forwardRef(() => UserService))
  ) {
    this._mailTransporter = createTransport(EmailAuthConfig.account);
  }

  async validate(token: string): Promise<User> {
    const session = await this.sessionRepository.findOne(token);

    if (!session) {
      throw new Error("세션이 없습니다.");
    }

    const user = session.user;
    if (!user) {
      throw new Error("회원이 아닙니다.");
    }

    return user;
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
      console.log(e);
      return null;
    }
  }

  async login(loginDto: LoginDto) {
    if (loginDto.type == "naver") {
      const userData = await this.getUserdataFromNaver(loginDto.accessToken);
      if (!userData) {
        throw new Error("올바르지 않은 토큰입니다.");
      }

      const user = await this.userService.findUserById(userData.id);
      if (!user) {
        throw new NotFoundException(
          "존재하지 않는 회원입니다. 회원가입을 진행해 주세요."
        );
      }

      const session = await this.sessionRepository.save(Session.create(user));
      return session.id;
    } else {
      throw new Error("올바르지 않는 타입입니다");
    }
  }

  async logout(logoutDto: LogoutDto) {
    const session = await this.sessionRepository.findOne(logoutDto.sessionId);

    if (!session) {
      throw new Error("로그인된 유저가 아닙니다.");
    }

    await this.sessionRepository.delete(session);
  }

  async emailAuthCreate(oauthId: string, univId: number, email: string) {
    //TODO + 탈퇴후 재가입 처리
    //TODO + 재발급 요청 횟수 제한, 동시 요청 처리
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let emailAuth = await queryRunner.manager.findOne(UniversityEmailAuth, {
      oauthId: oauthId,
    });

    if (!emailAuth) {
      emailAuth = UniversityEmailAuth.create(univId, oauthId, email);
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
      throw new HttpException("authInfo not found", HttpStatus.NOT_FOUND);
    }
    //3분 경과
    if (Date.now() - authInfo.updatedAt > 3 * 60 * 1000) {
      throw new HttpException("over auth timeout", HttpStatus.BAD_REQUEST);
    }
    //코드 불일치
    if (authInfo.authCode != authCode) {
      throw new HttpException("incorrect auth code", HttpStatus.BAD_REQUEST);
    }
    //TODO 리팩토링
    await this.userService.createUserByNaver(
      userdata.id,
      userdata.name,
      authInfo.universityId
    );
  }

  private _generateAuthCode(): string {
    return String(parseInt(randomBytes(2).toString("hex"), 16));
  }

  private _generateSessionId() {
    return v4();
  }
}
