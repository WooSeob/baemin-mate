import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Room } from "../room/entity/Room";
import { User } from "../user/entity/user.entity";
import { UniversityEmailAuth } from "../auth/entity/UniversityEmailAuth";
import { Participant } from "../room/entity/Participant";
import { Menu } from "../room/entity/Menu";
import { Match } from "../match/entity/Match";
import { ImageFile } from "../room/entity/ImageFile";
import RoomBlackList from "../room/entity/RoomBlackList";
import RoomVote from "../room/entity/RoomVote";
import VoteOpinion from "../room/entity/VoteOpinion";
import RoomChat from "../room/entity/RoomChat";
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
        TypeOrmModule.forFeature([RoomChat]),
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
