import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Connection, QueryRunner, Repository } from "typeorm";
import {
  SignUpState,
  UniversityEmailAuthEntity,
} from "../entity/university-email-auth.entity";
import { randomInt } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { v4 as uuid } from "uuid";
import { CreateSessionWithEmailDTO } from "../dto/CreateSessionWithEmailDTO";
import { Builder } from "builder-pattern";
import SubmitUserInfoRequestV1 from "../dto/request/SubmitUserInfoRequestV1";
import { UserEntity } from "../../../user/entity/user.entity";
import { UserOauthEntity } from "../../../user/entity/user-oauth.entity";
import {
  DuplicatedEmailException,
  InvalidStateException,
  SessionExpiredException,
  VerifyTrialOverException,
} from "../../exceptions/auth.exception";
import { MailService } from "../../../infra/mail/mail.service";

@Injectable()
export class SignupService {
  private readonly logger = new Logger("AuthService");

  private static CODE_VERIFY_TIMEOUT = 1000 * 60 * 5;

  constructor(
    public connection: Connection,
    @InjectRepository(UniversityEmailAuthEntity)
    private emailAuthRepository: Repository<UniversityEmailAuthEntity>,
    private mailService: MailService
  ) {}

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
      throw new VerifyTrialOverException();
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

      await this.mailService.sendSignupVerifyEmail(
        createSessionDto.email,
        authCode
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

    let authEntity: UniversityEmailAuthEntity;
    try {
      authEntity = await queryRunner.manager.findOne(
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

    if (authEntity) {
      authEntity.checkPassed();
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

      const existingSubmittedEmailAuths = await queryRunner.manager.find(
        UniversityEmailAuthEntity,
        {
          email: authEntity.email,
          state: SignUpState.USER_INFO_SUBMITTED,
        }
      );

      this.checkDuplicateEmailExist(
        existingSubmittedEmailAuths,
        authEntity.email
      );
      //TODO 해당 학교 email로 현재 활성 유저 존재하는지 검증

      authEntity.nickname = userInfo.nickname;
      authEntity.state = SignUpState.USER_INFO_SUBMITTED;

      //TODO TypeORM의 nested transaction에 대한 정보가 아직 부족해서.. user repo까지 해당 메소드에서 처리..
      const user = await queryRunner.manager.save<UserEntity>(
        Builder(UserEntity)
          .name(authEntity.nickname)
          .verified(true)
          .universityId(authEntity.universityId)
          .build()
      );

      await queryRunner.manager.save<UserOauthEntity>(
        Builder(UserOauthEntity)
          .id(authEntity.oauthId)
          .provider(authEntity.oauthProvider)
          .user(user)
          .build()
      );

      await queryRunner.manager.save(authEntity);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private checkDuplicateEmailExist(
    emailAuths: UniversityEmailAuthEntity[],
    email: string
  ) {
    if (emailAuths.length > 0) {
      throw new DuplicatedEmailException(email);
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
      throw new SessionExpiredException();
    }

    if (entity.state !== requiredState) {
      this.logger.warn(
        `잘못된 작업입니다. authEntity: ${entity} requiredState: ${requiredState}`
      );

      if (entity.state === SignUpState.TRIAL_OVER) {
        throw new VerifyTrialOverException();
      }

      throw new InvalidStateException();
    }
  }

  private static _generateAuthCode(): string {
    return String(randomInt(10000, 100000));
  }
}
