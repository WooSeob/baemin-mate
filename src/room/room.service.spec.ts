import { Test, TestingModule } from "@nestjs/testing";
import { RoomService } from "./room.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoomEntity } from "./entity/room.entity";

import { CreateRoomDto } from "./dto/request/create-room.dto";
import { UserEntity } from "../user/entity/user.entity";
import { ParticipantEntity } from "./entity/participant.entity";
import { MenuEntity } from "./entity/menu.entity";
import { AddMenuDto } from "../user/dto/request/add-menu.dto";
import { RoomState } from "./const/RoomState";
import { db_test } from "../../config";
import RoomBlacklistEntity, {
  RoomBlackListReason,
} from "./entity/room-blacklist.entity";
import { RoomEventType } from "./const/RoomEventType";
import AlreadyJoinedError from "../common/AlreadyJoinedError";
import { ImageFileEntity } from "./entity/image-file.entity";
import { RoomAccountEntity } from "./entity/room-account.entity";
import { CategoryType } from "../match/interfaces/category.interface";
import { UserService } from "../user/user.service";
import UniversityEntity from "../university/entity/university.entity";
import { MatchEntity } from "../match/entity/match.entity";
import { UserDeviceTokenEntity } from "../notification/entity/user-device-token.entity";
import DormitoryEntity from "../university/entity/dormitory.entity";
import { UserOauthEntity } from "../user/entity/user-oauth.entity";
import { UniversityEmailAuthEntity } from "../auth/entity/university-email-auth.entity";
import RoomChatEntity from "./entity/room-chat.entity";
import RoomVoteEntity, { RoomVoteType } from "./entity/room-vote.entity";
import VoteOpinionEntity from "./entity/vote-opinion.entity";
import {
  AlreadyInProgressRoomJoinedException,
  EmptyMenuException,
  KickAtAfterFixNotAllowedException,
} from "./exceptions/room.exception";

const userServiceMock = {
  on: jest.fn(),
};

const joinAndReady = async (
  service: RoomService,
  roomId: string,
  userId: string
) => {
  await service.joinRoom(roomId, userId);
  await service.addMenu(roomId, userId, sampleMenu);
  await service.setReady(roomId, userId, true);
};

const getTestingModule = async () => {
  return await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        ...db_test,
        keepConnectionAlive: true,
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
        ],
      }),
      TypeOrmModule.forFeature([
        RoomEntity,
        ParticipantEntity,
        MenuEntity,
        UserEntity,
        ImageFileEntity,
        RoomAccountEntity,
      ]),
    ],
    providers: [
      RoomService,
      {
        provide: UserService,
        useValue: userServiceMock,
      },
    ],
  }).compile();
};

const userOneId = "0e7660e5-3949-4ca2-93ab-b71eca6892da";
const userTwoId = "48ce7d82-e92b-43b0-ae42-5997bdd288ab";
const userThreeId = "f048b1eb-e4cf-4488-aa9c-9ba806d08225";
const userFourId = "63013179-f56b-4e98-8ded-372aedf3ed30";

const createRoomDto: CreateRoomDto = {
  shopName: "testshop",
  deliveryPriceAtLeast: 200,
  shopLink: "asdf",
  category: CategoryType.KOREAN,
  section: 1,
};

const sampleMenu: AddMenuDto = {
  name: "???????????? ??????",
  price: 5700,
  quantity: 2,
  description: "???????????????",
};

const sampleMenu2: AddMenuDto = {
  name: "??????????????? ?????? ??????",
  price: 6500,
  quantity: 3,
  description: "?????? ????????????",
};

describe("?????? ?????????", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();
    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("????????? ?????? ???????????? ?????? ???????????? ???????????? ??????.", async () => {
    const serviceSpy = jest.spyOn(service, "emit");

    const room = await service.createRoom(userOneId, createRoomDto);

    expect(room.purchaserId).toBe(userOneId);
    expect(serviceSpy).toBeCalledTimes(2);
    expect(serviceSpy).toBeCalledWith(RoomEventType.CREATE, room);
  });

  it("orderFix ?????? ????????? ?????? ?????? ?????? ?????? ????????? ??? ??????.", async () => {
    //given
    await service.createRoom(userOneId, createRoomDto);

    await expect(
      service.createRoom(userOneId, createRoomDto)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });

  it("?????? ??????(orderFix, orderCheck)??? ?????? ?????? ?????? ?????? ????????? ??? ??????.", async () => {
    //given
    const room = await service.createRoom(userOneId, createRoomDto);
    await joinAndReady(service, room.id, userTwoId);
    await service.fixOrder(room.id, userOneId);

    await expect(
      service.createRoom(userOneId, createRoomDto)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });

  it("?????? ??????(orderFix, orderCheck)??? ?????? ?????? ???????????? ?????? ????????? ??? ??????.", async () => {
    const firstRoom = await service.createRoom(userTwoId, createRoomDto);
    await service.joinRoom(firstRoom.id, userOneId);
    await service.addMenu(firstRoom.id, userOneId, sampleMenu);
    await service.setReady(firstRoom.id, userOneId, true);
    await service.fixOrder(firstRoom.id, userTwoId);

    await expect(
      service.createRoom(userOneId, createRoomDto)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });

  it("?????? ???(prepare, allready)??? ??? ??? ??????????????? ?????? ????????? ????????? ??? ??????.", async () => {
    const firstRoom = await service.createRoom(userTwoId, createRoomDto);
    await joinAndReady(service, firstRoom.id, userOneId);

    await expect(
      service.createRoom(userOneId, createRoomDto)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });
});

describe("?????? ?????????", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("??????", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await joinAndReady(service, room.id, userTwoId);

    expect((await service.findRoomById(room.id)).phase).toBe(
      RoomState.ALL_READY
    );
  });

  it("????????? ????????? ???????????? all ready??? ????????????.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);

    const serviceSpy = jest.spyOn(service, "emit");
    await service.addMenu(room.id, userTwoId, sampleMenu);
    await service.setReady(room.id, userTwoId, true);

    await service.joinRoom(room.id, userThreeId);

    expect(serviceSpy).toBeCalledWith(RoomEventType.ALL_READY, room.id);
    expect(serviceSpy).toBeCalledWith(
      RoomEventType.ALL_READY_CANCELED,
      room.id
    );

    expect((await service.findRoomById(room.id)).phase).toBe(RoomState.PREPARE);
  });

  it("???????????? ?????? ?????? ?????? ???????????? all ready ????????? ??????.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);
    await service.joinRoom(room.id, userThreeId);

    await service.addMenu(room.id, userTwoId, sampleMenu);
    await service.setReady(room.id, userTwoId, true);

    const serviceSpy = jest.spyOn(service, "emit");
    await service.kick(
      room.id,
      userThreeId,
      RoomBlackListReason.KICKED_BY_PURCHASER
    );

    expect(serviceSpy).toBeCalledWith(
      RoomEventType.USER_KICKED,
      room.id,
      userThreeId
    );
    expect(serviceSpy).toBeCalledWith(RoomEventType.ALL_READY, room.id);
    expect((await service.findRoomById(room.id)).phase).toBe(
      RoomState.ALL_READY
    );
  });

  it("????????? ????????? ????????? ????????? ??? ??????.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);

    await expect(
      service.setReady(room.id, userTwoId, true)
    ).rejects.toThrowError(EmptyMenuException);
  });
});

describe("?????? ?????????", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("?????? ?????? ??? ??????", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    const secondRoom = await service.createRoom(userTwoId, createRoomDto);

    await expect(
      service.joinRoom(secondRoom.id, userOneId)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });

  it("?????? ?????? ??? ??????", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    const secondRoom = await service.createRoom(userTwoId, createRoomDto);
    await service.joinRoom(firstRoom.id, userThreeId);
    await service.addMenu(firstRoom.id, userThreeId, sampleMenu);
    await service.setReady(firstRoom.id, userThreeId, true);
    await service.joinRoom(firstRoom.id, userFourId);

    try {
      // when
      await service.joinRoom(secondRoom.id, userThreeId);
      expect(false).toBe(true);
    } catch (e) {
      //then
      expect(e.message).toBe("?????? ??????????????? ?????? ???????????????.");
    }
  });

  it("?????? ????????? ?????? ????????? ??? ??????.", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);

    await expect(service.joinRoom(firstRoom.id, userTwoId)).rejects.toThrow(
      Error
    );
  });

  it("?????? ????????? ????????? ?????? ????????? ??? ??????.", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await expect(service.joinRoom(firstRoom.id, userOneId)).rejects.toThrow(
      Error
    );
  });

  it("?????? ????????? ?????? ??????", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.kick(
      firstRoom.id,
      userTwoId,
      RoomBlackListReason.KICKED_BY_PURCHASER
    );

    try {
      // when
      await service.joinRoom(firstRoom.id, userTwoId);
      expect(false).toBe(true);
    } catch (e) {
      //then
      expect(e.message).toBe("???????????? ?????? ????????? ?????????.");
    }
  });

  it("?????? ???(prepare, allready)??? ????????? ????????? ??? ??????.", async () => {
    // given
    const firstRoom = await service.createRoom(userTwoId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userOneId);

    const promises = [];
    promises.push(service.fixOrder(firstRoom.id, userTwoId));
    promises.push(service.joinRoom(firstRoom.id, userThreeId));

    await expect(Promise.all(promises)).rejects.toThrowError(Error);
  });

  it("?????? ???????????? ?????? ???????????? ???????????? ??????.", async () => {
    // given

    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    const serviceSpy = jest.spyOn(service, "emit");
    await service.joinRoom(firstRoom.id, userTwoId);
    expect(serviceSpy).toBeCalledWith(
      RoomEventType.USER_ENTER,
      firstRoom.id,
      userTwoId
    );

    expect(serviceSpy).toBeCalledTimes(1);
  });
});

describe("?????? ?????????", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("?????? ??????(orderFix, orderCheck)??? ?????? ?????? ??? ??????.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await joinAndReady(service, room.id, userTwoId);
    await service.fixOrder(room.id, userOneId);

    await expect(service.leaveRoom(room.id, userTwoId)).rejects.toThrowError(
      Error
    );
  });

  it("????????? ?????? ?????? ???????????? ?????? ??? ??????.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await joinAndReady(service, room.id, userTwoId);
    await service.fixOrder(room.id, userOneId);

    await expect(service.leaveRoom(room.id, userOneId)).rejects.toThrowError(
      Error
    );
  });

  it("?????? ????????? ?????? ????????? ?????? ????????????.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);
    await service.leaveRoom(room.id, userTwoId);

    const serviceSpy = jest.spyOn(service, "emit");
    const after = await service.leaveRoom(room.id, userOneId);

    const found = await service.findRoomById(room.id);
    expect(found).toBeUndefined();
    expect(serviceSpy).toBeCalledWith(RoomEventType.DELETED, after);
  });

  it("????????? ????????? ?????? ???????????? ????????????.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);

    const serviceSpy = jest.spyOn(service, "emit");
    await service.leaveRoom(room.id, userTwoId);

    expect(serviceSpy).toBeCalledWith(
      RoomEventType.USER_LEAVE,
      room.id,
      userTwoId
    );
  });
});

describe("?????? ?????????", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("?????? ?????? ?????? ??????", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);

    //when
    await service.kick(
      firstRoom.id,
      userTwoId,
      RoomBlackListReason.KICKED_BY_PURCHASER
    );

    //then
    expect(
      (await service.findRoomById(firstRoom.id)).isParticipant(userTwoId)
    ).toBe(false);
  });

  it("?????? ??? ?????? ??????", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userTwoId);

    //when
    await service.kick(
      firstRoom.id,

      userTwoId,
      RoomBlackListReason.KICKED_BY_PURCHASER
    );

    //then
    expect(
      (await service.findRoomById(firstRoom.id)).isParticipant(userTwoId)
    ).toBe(false);
  });

  it("????????? ???????????? ??? ??????.", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);

    //when
    await expect(
      service.kick(
        firstRoom.id,
        userOneId,
        RoomBlackListReason.KICKED_BY_PURCHASER
      )
    ).rejects.toThrow(Error); //then
  });

  it("OrderFix ????????????", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userTwoId);

    await service.fixOrder(firstRoom.id, userOneId);

    await expect(
      service.kick(
        firstRoom.id,
        userTwoId,
        RoomBlackListReason.KICKED_BY_PURCHASER
      )
    ).rejects.toThrowError(KickAtAfterFixNotAllowedException);
  });
});

describe("?????? ?????? ?????????", () => {
  let service: RoomService;

  // beforeAll(async () => {
  //   const module: TestingModule = await Test.createTestingModule({
  //     imports: [
  //       TypeOrmModule.forRoot({ ...db_test, keepConnectionAlive: true }),
  //       TypeOrmModule.forFeature([
  //         RoomEntity,
  //         ParticipantEntity,
  //         MenuEntity,
  //         User,
  //         ImageFileEntity,
  //         RoomAccountEntity,
  //       ]),
  //     ],
  //     providers: [RoomService],
  //   }).compile();
  //
  //   service = module.get<RoomService>(RoomService);
  //   await service.clear();
  // });

  beforeEach(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  it("??????", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userTwoId);
    await joinAndReady(service, firstRoom.id, userThreeId);

    await service.fixOrder(firstRoom.id, userOneId);

    //when
    const serviceSpy = jest.spyOn(service, "emit");
    const created = await service.createKickVote(
      firstRoom.id,
      userOneId,
      userTwoId
    );

    //then
    expect(created.targetUserId).toBe(userTwoId);
    expect(serviceSpy).toBeCalledWith(RoomEventType.KICK_VOTE_CREATED, created);
  });

  it("?????? ??????", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userTwoId);
    await joinAndReady(service, firstRoom.id, userThreeId);

    await service.fixOrder(firstRoom.id, userOneId);
    const vote = await service.createKickVote(
      firstRoom.id,
      userOneId,
      userTwoId
    );

    //when
    await service.doVote(vote.id, userThreeId, true);
    //then
    // expect(created.target.userId).toBe(userTwoId);
    expect(true).toBe(true);
  });

  it("??????(??????)", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userTwoId);
    await joinAndReady(service, firstRoom.id, userThreeId);

    await service.fixOrder(firstRoom.id, userOneId);
    const vote = await service.createKickVote(
      firstRoom.id,
      userOneId,
      userTwoId
    );

    //when
    const serviceSpy = jest.spyOn(service, "emit");
    const kickMethod = jest.spyOn(service, "kick");
    await service.doVote(vote.id, userThreeId, true);

    //then
    //TODO ?????? ????????? ????????? ??????????????? ???????????? ???????????????, ?????????????????? ?????? -> ?????? ?????????????????? ????????? ??????
    const result = await service.getVoteById(vote.id);
    expect(result.finished).toBe(true);
    expect(result.result).toBe(true);
    expect(serviceSpy).toBeCalledWith(RoomEventType.KICK_VOTE_FINISHED, result);
    expect(kickMethod).toBeCalledTimes(1);
  });

  it("??????(??????)", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userTwoId);
    await joinAndReady(service, firstRoom.id, userThreeId);

    await service.fixOrder(firstRoom.id, userOneId);
    const vote = await service.createKickVote(
      firstRoom.id,
      userOneId,
      userTwoId
    );

    //when
    const serviceSpy = jest.spyOn(service, "emit");
    const kickMethod = jest.spyOn(service, "kick");
    await service.doVote(vote.id, userThreeId, false);

    //then
    const result = await service.getVoteById(vote.id);
    console.log(result);
    expect(result.finished).toBe(true);
    expect(result.result).toBe(false);
    expect(serviceSpy).toBeCalledWith(RoomEventType.KICK_VOTE_FINISHED, result);
    expect(kickMethod).toBeCalledTimes(0);
  });
});

describe("?????? ?????? ?????????", () => {
  let service: RoomService;

  // beforeAll(async () => {
  //
  // });

  beforeEach(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  const prepareFixRoom = async () => {
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userTwoId);
    await joinAndReady(service, firstRoom.id, userThreeId);

    await service.fixOrder(firstRoom.id, userOneId);
    return firstRoom;
  };

  it("??????", async () => {
    // given
    const room = await prepareFixRoom();
    //when
    const serviceSpy = jest.spyOn(service, "emit");
    const vote = await service.createResetVote(room.id, userOneId);

    //then
    expect(vote).toBeDefined();
    expect(serviceSpy).toBeCalledWith(RoomEventType.RESET_VOTE_CREATED, vote);
  });

  it("??????(??????)", async () => {
    //TODO ?????? ?????? ????????????
    // given
    const room = await prepareFixRoom();
    const vote = await service.createResetVote(room.id, userOneId);

    const serviceSpy = jest.spyOn(service, "emit");
    const resetMethod = jest.spyOn(service, "resetRoom");

    //when
    await service.doVote(vote.id, userTwoId, true);
    await service.doVote(vote.id, userThreeId, true);

    //then
    const result = await service.getVoteById(vote.id);
    expect(serviceSpy).toBeCalledWith(
      RoomEventType.RESET_VOTE_FINISHED,
      result
    );
    expect(resetMethod).toBeCalledTimes(1);
  });

  it("??????(??????)", async () => {
    //TODO ?????? ?????? ????????????
    // given
    const room = await prepareFixRoom();
    const vote = await service.createResetVote(room.id, userOneId);

    const serviceSpy = jest.spyOn(service, "emit");
    const resetMethod = jest.spyOn(service, "resetRoom");

    //when
    await service.doVote(vote.id, userTwoId, false);
    await service.doVote(vote.id, userThreeId, false);

    //then
    const result = await service.getVoteById(vote.id);
    expect(serviceSpy).toBeCalledWith(
      RoomEventType.RESET_VOTE_FINISHED,
      result
    );
    expect(resetMethod).toBeCalledTimes(0);
  });
});

describe("?????? ?????????", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("??????", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);

    // Create
    const created = await service.addMenu(room.id, userTwoId, sampleMenu);
    expect(
      await service.findMenusByParticipant(room.id, userTwoId)
    ).toHaveLength(1);

    expect(created.name).toBe(sampleMenu.name);
  });

  it("??????", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);
    const created = await service.addMenu(room.id, userTwoId, sampleMenu);

    // Update
    await service.updateMenu(room.id, userTwoId, created.id, sampleMenu2);
    expect(
      await service.findMenusByParticipant(room.id, userTwoId)
    ).toHaveLength(1);

    const updated = await service.findMenuByParticipant(
      room.id,
      userTwoId,
      created.id
    );
    expect(updated.name).toBe(sampleMenu2.name);
  });

  it("??????", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);
    const created = await service.addMenu(room.id, userTwoId, sampleMenu);

    // Delete
    await service.deleteMenu(room.id, userTwoId, created.id);
    expect(
      await service.findMenusByParticipant(room.id, userTwoId)
    ).toHaveLength(0);
  });
});

const aFewSecondsLater = (ms) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(1);
    }, ms);
  });
};
