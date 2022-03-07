import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoomEntity } from "../room/entity/room.entity";
import { UserEntity } from "../user/entity/user.entity";
import { UniversityEmailAuthEntity } from "../auth/entity/university-email-auth.entity";
import { ParticipantEntity } from "../room/entity/participant.entity";
import { MenuEntity } from "../room/entity/menu.entity";
import { MatchEntity } from "../match/entity/match.entity";
import { ImageFileEntity } from "../room/entity/image-file.entity";
import RoomBlacklistEntity from "../room/entity/room-blacklist.entity";
import RoomVoteEntity from "../room/entity/room-vote.entity";
import VoteOpinionEntity from "../room/entity/vote-opinion.entity";
import RoomChatEntity from "../room/entity/room-chat.entity";
import { RoomService } from "../room/room.service";
import { EventEmitter } from "stream";
import { RoomModule } from "../room/room.module";
import { RoomEventType } from "../room/const/RoomEventType";

import { Server as MockServer } from "mock-socket";
import { Server } from "socket.io";
import { UserService } from "../user/user.service";
import { UserModule } from "../user/user.module";
import { db } from "../../config";

class MockRoomService extends EventEmitter {}
const MockRoomServiceProvider = {
  provide: RoomService,
  useClass: MockRoomService,
};

describe("ChatService", () => {
  let mockRoomService: RoomService;
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(db),
        TypeOrmModule.forFeature([RoomChatEntity]),
        UserModule,
      ],
      providers: [ChatService, MockRoomServiceProvider],
    }).compile();

    service = module.get<ChatService>(ChatService);
    mockRoomService = module.get<RoomService>(RoomService);
    await service.clear();
    // service.server = new MockServer("");

    const fakeURL = "ws://localhost:8080";
    // const mockServer = ;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(mockRoomService).toBeDefined();
  });

  it("유저 입장 메시지", async () => {
    const roomId = "f9c20621-a116-413a-a3dc-d395151847fa";
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, "abdc");
    await aFewSecondsLater(1000);
    const messages = await service.getAllMessagesByRoom(roomId);
    expect(messages).toHaveLength(1);
    console.log(messages);
  });
});

const aFewSecondsLater = (ms) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(1);
    }, ms);
  });
};
