import {
  ConsoleLogger,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { IUserContainer } from "../core/container/IUserContainer";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import axios, { AxiosResponse } from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../user/entity/user.entity";
import { Repository } from "typeorm";
import { UserService } from "../user/user.service";
import { createTransport, Transporter } from "nodemailer";
import { EmailAuth } from "./entity/email-auth.entity";
import { randomBytes } from "crypto";
import { EmailAuthConfig } from "../../config";

interface NaverAuthResponse {
  id: string;
  mobile: string;
  mobile_e164: string;
  name: string;
}

@Injectable()
export class AuthService {
  private readonly _mailTransporter: Transporter;

  constructor(
    @InjectRepository(EmailAuth)
    private emailAuthRepository: Repository<EmailAuth>,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {
    this._mailTransporter = createTransport(EmailAuthConfig.account);
  }

  async validate(token: string): Promise<User> {
    let res: AxiosResponse;
    try {
      res = await axios.get("https://openapi.naver.com/v1/nid/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.log(e);
      return null;
    }

    const info: NaverAuthResponse = res.data.response;
    const found = await this.userService.findUserById(info.id);
    if (!found) {
      return this.userService.createUserByNaver(
        info.id,
        info.name,
        info.mobile_e164
      );
    }
    return found;
  }

  login(loginDto: LoginDto) {
    // if (this.validate(loginDto)) {
    //   const userEntity = this.database.get(loginDto.userId);
    //   this.userContainer.push(
    //     new User(userEntity.id, userEntity.section, userEntity.manner)
    //   );
    //   return this.userContainer.findById(loginDto.userId).sessionId;
    // }
    // return null;
  }

  logout(logoutDto: LogoutDto) {
    // const user = this.userContainer.findById(logoutDto.userId);
    // if (!user) {
    //   return null;
    // }
    // if (logoutDto.sessionId != user.sessionId) {
    //   return null;
    // }
    // this.userContainer.delete(user);
  }

  // validate(loginDto: LoginDto) {
  //   if (this.database.has(loginDto.userId)) {
  //     const userEntity = this.database.get(loginDto.userId);
  //     if (loginDto.password === userEntity.password) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  verifySession(id, token) {
    // return (
    //   this.userContainer.findById(id) &&
    //   this.userContainer.findById(id).sessionId == token
    // );
    return true;
  }

  async emailAuthCreate(user: User, email: string) {
    //기존 정보 제거
    await this.emailAuthRepository.delete({ userid: user.id });
    //TODO email 도메인 체크
    const AuthCode = String(parseInt(randomBytes(2).toString("hex"), 16));
    const emailAuth = new EmailAuth();
    emailAuth.userid = user.id;
    emailAuth.authCode = AuthCode;
    emailAuth.createdAt = Date.now();
    await this.emailAuthRepository.save(emailAuth);

    let info = await this._mailTransporter.sendMail({
      // 보내는 곳의 이름과, 메일 주소를 입력
      from: EmailAuthConfig.content.from,
      // 받는 곳의 메일 주소를 입력
      to: email,
      // 보내는 메일의 제목을 입력
      subject: EmailAuthConfig.content.subject,
      // 보내는 메일의 내용을 입력
      // text: 일반 text로 작성된 내용
      // html: html로 작성된 내용
      text: AuthCode,
      html: `<h1>${AuthCode}</h1>`,
    });
  }

  async emailAuthVerify(user: User, authCode: string) {
    const authInfo = await this.emailAuthRepository.findOne({
      userid: user.id,
    });
    //auth info 없음
    if (!authInfo) {
      throw new HttpException("authInfo not found", HttpStatus.NOT_FOUND);
    }
    //3분 경과
    if (Date.now() - authInfo.createdAt > 3 * 60 * 1000) {
      throw new HttpException("over auth timeout", HttpStatus.BAD_REQUEST);
    }
    //코드 불일치
    if (authInfo.authCode != authCode) {
      throw new HttpException("incorrect auth code", HttpStatus.BAD_REQUEST);
    }
    await this.userService.verify(user);
  }
}
