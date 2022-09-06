import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Connection, QueryRunner, Repository } from "typeorm";
import {
  SignUpState,
  UniversityEmailAuthEntity,
} from "./entity/university-email-auth.entity";
import { randomInt } from "crypto";
import { EmailAuthConfig } from "../../../config";
import { InjectRepository } from "@nestjs/typeorm";
import { createTransport, Transporter } from "nodemailer";
import { v4 as uuid } from "uuid";
import { CreateSessionWithEmailDTO } from "./dto/CreateSessionWithEmailDTO";
import { Builder } from "builder-pattern";
import SubmitUserInfoRequestV1 from "./dto/request/SubmitUserInfoRequestV1";

@Injectable()
export class SignupService {
  private readonly _mailTransporter: Transporter;

  private static CODE_VERIFY_TIMEOUT = 1000 * 60 * 5;

  constructor(
    public connection: Connection,
    @InjectRepository(UniversityEmailAuthEntity)
    private emailAuthRepository: Repository<UniversityEmailAuthEntity>
  ) {
    this._mailTransporter = createTransport(EmailAuthConfig.getAccount());
  }

  async createEmailAuthSession(
    createSessionDto: CreateSessionWithEmailDTO
  ): Promise<UniversityEmailAuthEntity> {
    //TODO + 탈퇴후 재가입 처리
    //TODO + 재발급 요청 횟수 제한, 동시 요청 처리
    const authEntities = await this.emailAuthRepository.find({
      email: createSessionDto.email,
      state: SignUpState.TRIAL_OVER,
    });

    if (authEntities.length > 0) {
      throw new BadRequestException(
        "일일 인증 시도 횟수를 초과했습니다. 다음에 시도해 주세요."
      );
    }

    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const authCode = SignupService._generateAuthCode();

      const emailAuth = Builder(UniversityEmailAuthEntity)
        .oauthId(createSessionDto.oauthIdentifier)
        .oauthProvider(createSessionDto.oauthProvider)
        .universityId(createSessionDto.univId)
        .email(createSessionDto.email)
        .authCode(authCode)
        .sessionId(uuid())
        .expiresIn(Date.now() + SignupService.CODE_VERIFY_TIMEOUT)
        .build();

      await this._mailTransporter.sendMail(
        SignupService._createEmailMessage(createSessionDto.email, authCode)
      );

      await queryRunner.manager.save(emailAuth);
      await queryRunner.commitTransaction();

      return emailAuth;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyByCode(sessionId: string, code: string) {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const authEntity = await queryRunner.manager.findOne(
        UniversityEmailAuthEntity,
        {
          sessionId: sessionId,
        }
      );

      this.preValidate(authEntity, sessionId, SignUpState.VERIFY_CODE_SENT);
      authEntity.try(code);

      await queryRunner.manager.save(authEntity);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createUserWithInfo(
    sessionId: string,
    userInfo: SubmitUserInfoRequestV1
  ) {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const authEntity = await queryRunner.manager.findOne(
        UniversityEmailAuthEntity,
        {
          sessionId: sessionId,
        }
      );

      this.preValidate(authEntity, sessionId, SignUpState.VERIFIED);

      //TODO 해당 학교 email로 현재 활성 유저 존재하는지 검증

      authEntity.nickname = userInfo.nickname;
      authEntity.state = SignUpState.USER_INFO_SUBMITTED;

      await queryRunner.manager.save(authEntity);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private preValidate(
    entity: UniversityEmailAuthEntity,
    sessionId: string,
    requiredState: SignUpState
  ) {
    if (!entity) {
      throw new NotFoundException(
        `해당 세션이 없습니다. sessionId: ${sessionId}`
      );
    }

    if (entity.expiresIn < Date.now()) {
      throw new BadRequestException("만료된 인증입니다.");
    }

    if (entity.state != requiredState) {
      throw new BadRequestException(
        `잘못된 작업입니다. current state: ${entity.state}`
      );
    }
  }

  private static _generateAuthCode(): string {
    return String(randomInt(10000, 100000));
  }

  private static _createEmailMessage(to: string, authCode: string) {
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
}
