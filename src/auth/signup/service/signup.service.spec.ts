import { Test, TestingModule } from "@nestjs/testing";
import { SignupService } from "./signup.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { db_test } from "../../../../config";
import {
  SignUpState,
  UniversityEmailAuthEntity,
} from "../entity/university-email-auth.entity";
import { RoomEntity } from "../../../room/entity/room.entity";
import { ParticipantEntity } from "../../../room/entity/participant.entity";
import { MenuEntity } from "../../../room/entity/menu.entity";
import { UserEntity } from "../../../user/entity/user.entity";
import { ImageFileEntity } from "../../../room/entity/image-file.entity";
import { RoomAccountEntity } from "../../../room/entity/room-account.entity";
import UniversityEntity from "../../../university/entity/university.entity";
import { MatchEntity } from "../../../match/entity/match.entity";
import { UserDeviceTokenEntity } from "../../../notification/entity/user-device-token.entity";
import DormitoryEntity from "../../../university/entity/dormitory.entity";
import { UserOauthEntity } from "../../../user/entity/user-oauth.entity";
import RoomBlacklistEntity from "../../../room/entity/room-blacklist.entity";
import RoomChatEntity from "../../../room/entity/room-chat.entity";
import RoomVoteEntity from "../../../room/entity/room-vote.entity";
import VoteOpinionEntity from "../../../room/entity/vote-opinion.entity";
import UserChatMetadataEntity from "../../../chat/entity/user-chat-metadata.entity";
import { MailService } from "../../../infra/mail/mail.service";
import { GenerationService } from "./generation.service";
import { OAuthProvider } from "../../interface/OAuthProvider";
import {
  VerifyTrialOverException,
  WrongVerifyCodeException,
} from "../../exceptions/auth.exception";

const FakeGenerationService = {
  createSessionKey: () => {
    return "test_session_key";
  },
  createAuthCode: () => {
    return "12345";
  },
};

const FakeMailService = {
  sendSignupVerifyEmail: (to: string, authCode: string) => {
    return Promise.resolve();
  },
};

describe("SignupService", () => {
  let service: SignupService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...db_test,
          keepConnectionAlive: false,
          entities: [
            RoomEntity,
            ParticipantEntity,
            MenuEntity,
            UserEntity,
            ImageFileEntity,
            RoomAccountEntity,
            UniversityEntity,
            MatchEntity,
            UserDeviceTokenEntity,
            DormitoryEntity,
            UserOauthEntity,
            UniversityEmailAuthEntity,
            RoomBlacklistEntity,
            RoomChatEntity,
            RoomVoteEntity,
            VoteOpinionEntity,
            UserChatMetadataEntity,
          ],
          logging: ["query"],
        }),
        TypeOrmModule.forFeature([UniversityEmailAuthEntity]),
      ],
      providers: [
        SignupService,
        {
          provide: MailService,
          useValue: FakeMailService,
        },
        {
          provide: GenerationService,
          useValue: FakeGenerationService,
        },
      ],
    }).compile();

    service = module.get<SignupService>(SignupService);
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("signup 세션이 생성되어야 한다.", async () => {
    const authEntity = await service.createEmailAuthSession(
      testCreateSessionDto
    );
    expect(authEntity.sessionId).toBe(FakeGenerationService.createSessionKey());
  });

  it("인증 번호가 올바른 경우 상태가 verified가 된다.", async () => {
    // given
    await service.createEmailAuthSession(testCreateSessionDto);

    // when
    const authEntity = await service.verifyByCode(
      FakeGenerationService.createSessionKey(),
      FakeGenerationService.createAuthCode()
    );

    // then
    expect(authEntity.state).toBe(SignUpState.VERIFIED);
  });

  it("인증 번호가 잘못될 경우 실패해야 한다.", async () => {
    // given
    await service.createEmailAuthSession(testCreateSessionDto);

    await expect(
      // when
      service.verifyByCode(
        FakeGenerationService.createSessionKey(),
        "wrong code"
      )
      //then
    ).rejects.toThrowError(WrongVerifyCodeException);
  });

  it("인증 번호 5회 실패 후 시도 시 시도횟수 초과 예외가 발생해야 한다.", async () => {
    async function tryFailCode5timesIgnoringException() {
      for (let i = 0; i < 5; i++) {
        try {
          await service.verifyByCode(
            FakeGenerationService.createSessionKey(),
            "wrong code"
          );
        } catch (e) {}
      }
    }

    // given
    await service.createEmailAuthSession(testCreateSessionDto);
    await tryFailCode5timesIgnoringException();

    await expect(
      //when
      service.verifyByCode(
        FakeGenerationService.createSessionKey(),
        "wrong code"
      )
      //then
    ).rejects.toThrowError(VerifyTrialOverException);
  });
});

const testCreateSessionDto = {
  email: "test@test.com",
  univId: 1,
  oauthIdentifier: "test",
  oauthProvider: OAuthProvider.NAVER,
};
