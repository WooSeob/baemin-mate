import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoomEntity, RoomRole } from "../room/entity/room.entity";
import { UserBuilder, UserEntity } from "../user/entity/user.entity";
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
import { RoomEventType } from "../room/const/RoomEventType";

import { UserService } from "../user/user.service";
import { db_test } from "../../config";
import { RoomAccountEntity } from "../room/entity/room-account.entity";
import UniversityEntity from "../university/entity/university.entity";
import { UserDeviceTokenEntity } from "../notification/entity/user-device-token.entity";
import DormitoryEntity from "../university/entity/dormitory.entity";
import { UserOauthEntity } from "../user/entity/user-oauth.entity";
import { ChatGateway } from "./chat.gateway";
import UserChatMetadataEntity from "./entity/user-chat-metadata.entity";

const createMockRoomService = () => {
  const eventEmitter = new EventEmitter();

  const kicked = new Set();

  eventEmitter.on(RoomEventType.USER_KICKED, (roomId, userId) => {
    kicked.add(userId);
  });

  return {
    on: (evName, listener) => {
      eventEmitter.on(evName, listener);
    },

    emit: (evName, ...args) => {
      eventEmitter.emit(evName, ...args);
    },

    getRoomRole: (roomId, userId) => {
      return kicked.has(userId) ? RoomRole.BANNED : RoomRole.MEMBER;
    },
  };
};
const MockRoomServiceProvider = {
  provide: RoomService,
  useValue: createMockRoomService(),
};

const MockRoomGatewayProvider = {
  provide: ChatGateway,
  useValue: {
    broadcastChat: jest.fn(),
    broadcastLatestChatReadIds: jest.fn(),
  },
};

const MockUserServiceProvider = {
  provide: UserService,
  useValue: {
    on: jest.fn(),
    findUserOrUnknownIfNotExist: (userId: string) => {
      return new UserBuilder().setId(userId).setName("(?????????)").build();
    },
  },
};

const getTestingModule = async () => {
  return await Test.createTestingModule({
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
      TypeOrmModule.forFeature([RoomChatEntity, UserChatMetadataEntity]),
    ],
    providers: [
      ChatService,
      MockRoomServiceProvider,
      MockRoomGatewayProvider,
      MockUserServiceProvider,
    ],
  }).compile();
};

const roomId = "d0e65ffd-92c7-44e6-921f-f4d225c6115f";
const userOne = "0e7660e5-3949-4ca2-93ab-b71eca6892da";
const userTwo = "48ce7d82-e92b-43b0-ae42-5997bdd288ab";

describe("?????? ?????????", () => {
  let mockRoomService: RoomService;
  let service: ChatService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();
    service = module.get<ChatService>(ChatService);
    mockRoomService = module.get<RoomService>(RoomService);
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(mockRoomService).toBeDefined();
  });

  it("?????? ?????? ???????????? ????????? ??? ??????.", async () => {
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userOne);
    await aFewSecondsLater(1000);

    await service.onChatEvent(roomId, userOne, "1");
    await service.onChatEvent(roomId, userOne, "2");
    await service.onChatEvent(roomId, userOne, "3");

    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userTwo);
    await aFewSecondsLater(1000);

    const messages = await service.getAllMessagesByRoomForUser(roomId, userTwo);

    expect(messages).toHaveLength(1);
  });

  it("???????????? ??? ????????? ???????????? ????????? ??? ??????.", async () => {
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userOne);
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userTwo);

    await aFewSecondsLater(1000);

    await service.onChatEvent(roomId, userOne, "1");
    await service.onChatEvent(roomId, userOne, "2");
    await service.onChatEvent(roomId, userOne, "3");

    mockRoomService.emit(RoomEventType.USER_KICKED, roomId, userTwo);

    await service.onChatEvent(roomId, userOne, "4");
    await service.onChatEvent(roomId, userOne, "5");
    await service.onChatEvent(roomId, userOne, "6");

    await aFewSecondsLater(1000);

    const messagesForUserOne = await service.getAllMessagesByRoomForUser(
      roomId,
      userOne
    );
    expect(messagesForUserOne).toHaveLength(9);

    const messagesForUserTwo = await service.getAllMessagesByRoomForUser(
      roomId,
      userTwo
    );
    expect(messagesForUserTwo).toHaveLength(5);
  });
});

describe("?????? ?????? ?????????", () => {
  let mockRoomService: RoomService;
  let service: ChatService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();
    service = module.get<ChatService>(ChatService);
    mockRoomService = module.get<RoomService>(RoomService);
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("????????? ????????? ???????????? ????????? ?????? ?????? ?????? ??????.", async () => {
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userOne);
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userTwo);
    await aFewSecondsLater(1000);

    await service.onChatEvent(roomId, userOne, "1");
    await service.onChatEvent(roomId, userOne, "2");
    await service.onChatEvent(roomId, userOne, "3");

    const readIds = await service.getReadMessageIds(roomId);
    expect(readIds).toHaveLength(2);

    const readIdMap = new Map(
      readIds.map((item) => [item.userId, item.messageId])
    );

    const messages = await service.getAllMessagesByRoomForUser(roomId, userOne);
    expect(readIdMap.get(userOne)).toBe(messages[messages.length - 1].id);
    expect(readIdMap.get(userTwo)).toBe(messages[1].id);
  });

  it("???????????? ??? ???????????? ????????????.", async () => {
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userOne);
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userTwo);
    await aFewSecondsLater(1000);

    await service.onChatEvent(roomId, userOne, "1");
    await service.onChatEvent(roomId, userOne, "2");
    const messageTwo = await service.onChatEvent(roomId, userOne, "3");

    await service.updateReadMessageId(
      roomId,
      userTwo,
      messageTwo.id // userOne ??? "3" ?????? ??????
    );

    await service.onChatEvent(roomId, userOne, "4");
    await service.onChatEvent(roomId, userOne, "5");
    const messageOne = await service.onChatEvent(roomId, userOne, "6");

    const readIds = await service.getReadMessageIds(roomId);

    expect(readIds).toHaveLength(2);

    const readIdMap = new Map(
      readIds.map((item) => [item.userId, item.messageId])
    );

    expect(readIdMap.get(userOne)).toBe(messageOne.id);
    expect(readIdMap.get(userTwo)).toBe(messageTwo.id);
  });

  it("???????????? ????????? ?????? ?????? ????????? ???????????? ?????????.", async () => {
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userOne);
    mockRoomService.emit(RoomEventType.USER_ENTER, roomId, userTwo);
    await aFewSecondsLater(1000);

    await service.onChatEvent(roomId, userOne, "1");
    await service.onChatEvent(roomId, userOne, "2");

    mockRoomService.emit(RoomEventType.USER_KICKED, roomId, userTwo);

    await service.onChatEvent(roomId, userOne, "3");

    const readIds = await service.getReadMessageIds(roomId);
    console.log(readIds);
    expect(readIds).toHaveLength(1);
  });
});

const aFewSecondsLater = (ms) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(1);
    }, ms);
  });
};
