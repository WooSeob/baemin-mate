import { Test, TestingModule } from "@nestjs/testing";
import { ChatGateway } from "./chat.gateway";
import { RoomModule } from "../room/room.module";
import { UserModule } from "../user/user.module";
import { AuthModule } from "../auth/auth.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UniversityModule } from "../university/university.module";
import { MatchModule } from "../match/match.module";
import { ChatModule } from "./chat.module";
import { S3Module } from "../infra/s3/s3.module";
import { FcmModule } from "../infra/fcm/fcm.module";
import { NotificationModule } from "../notification/notification.module";

describe("RoomGateway", () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RoomModule,
        UserModule,
        AuthModule,
        MatchModule,
        ChatModule,
        TypeOrmModule.forRoot(),
        UniversityModule,
        S3Module,
        FcmModule,
        NotificationModule,
      ],
      controllers: [],
      providers: [],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it("should be defined", () => {
    expect(gateway).toBeDefined();
  });
});
