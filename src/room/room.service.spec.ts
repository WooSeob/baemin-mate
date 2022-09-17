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
import { UniversityEmailAuthEntity } from "../auth/signup/entity/university-email-auth.entity";
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
  name: "싸이버거 세트",
  price: 5700,
  quantity: 2,
  description: "제로콜라로",
};

const sampleMenu2: AddMenuDto = {
  name: "화이트갈릭 버거 세트",
  price: 6500,
  quantity: 3,
  description: "제로 사이다로",
};

describe("생성 테스트", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();
    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("생성시 생성 이벤트와 참가 이벤트가 발생해야 한다.", async () => {
    const serviceSpy = jest.spyOn(service, "emit");

    const room = await service.createRoom(userOneId, createRoomDto);

    expect(room.purchaserId).toBe(userOneId);
    expect(serviceSpy).toBeCalledTimes(2);
    expect(serviceSpy).toBeCalledWith(RoomEventType.CREATE, room);
  });

  it("orderFix 이전 상태인 개설 방이 있는 경우 생성할 수 없다.", async () => {
    //given
    await service.createRoom(userOneId, createRoomDto);

    await expect(
      service.createRoom(userOneId, createRoomDto)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });

  it("진행 상태(orderFix, orderCheck)인 개설 방이 있는 경우 생성할 수 없다.", async () => {
    //given
    const room = await service.createRoom(userOneId, createRoomDto);
    await joinAndReady(service, room.id, userTwoId);
    await service.fixOrder(room.id, userOneId);

    await expect(
      service.createRoom(userOneId, createRoomDto)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });

  it("진행 상태(orderFix, orderCheck)에 있는 방에 참여중인 경우 생성할 수 없다.", async () => {
    const firstRoom = await service.createRoom(userTwoId, createRoomDto);
    await service.joinRoom(firstRoom.id, userOneId);
    await service.addMenu(firstRoom.id, userOneId, sampleMenu);
    await service.setReady(firstRoom.id, userOneId, true);
    await service.fixOrder(firstRoom.id, userTwoId);

    await expect(
      service.createRoom(userOneId, createRoomDto)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });

  it("진행 전(prepare, allready)인 방 중 준비완료한 방이 있으면 생성할 수 없다.", async () => {
    const firstRoom = await service.createRoom(userTwoId, createRoomDto);
    await joinAndReady(service, firstRoom.id, userOneId);

    await expect(
      service.createRoom(userOneId, createRoomDto)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });
});

describe("레디 테스트", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("레디", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await joinAndReady(service, room.id, userTwoId);

    expect((await service.findRoomById(room.id)).phase).toBe(
      RoomState.ALL_READY
    );
  });

  it("새로운 유저가 들어오면 all ready가 해제된다.", async () => {
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

  it("유일하게 레디 안한 유저 강퇴하면 all ready 상태가 된다.", async () => {
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

  it("작성한 메뉴가 없으면 레디할 수 없다.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);

    await expect(
      service.setReady(room.id, userTwoId, true)
    ).rejects.toThrowError(EmptyMenuException);
  });
});

describe("참가 테스트", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("이미 다른 방 방장", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    const secondRoom = await service.createRoom(userTwoId, createRoomDto);

    await expect(
      service.joinRoom(secondRoom.id, userOneId)
    ).rejects.toThrowError(AlreadyInProgressRoomJoinedException);
  });

  it("이미 다른 방 레디", async () => {
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
      expect(e.message).toBe("이미 준비완료한 방이 존재합니다.");
    }
  });

  it("이미 참여한 방엔 입장할 수 없다.", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);

    await expect(service.joinRoom(firstRoom.id, userTwoId)).rejects.toThrow(
      Error
    );
  });

  it("자기 자신이 방장인 곳엔 입장할 수 없다.", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);

    await expect(service.joinRoom(firstRoom.id, userOneId)).rejects.toThrow(
      Error
    );
  });

  it("강퇴 이력이 있는 유저", async () => {
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
      expect(e.message).toBe("강제퇴장 당한 이용자 입니다.");
    }
  });

  it("진행 전(prepare, allready)인 방에만 입장할 수 있다.", async () => {
    // given
    const firstRoom = await service.createRoom(userTwoId, createRoomDto);

    await joinAndReady(service, firstRoom.id, userOneId);

    const promises = [];
    promises.push(service.fixOrder(firstRoom.id, userTwoId));
    promises.push(service.joinRoom(firstRoom.id, userThreeId));

    await expect(Promise.all(promises)).rejects.toThrowError(Error);
  });

  it("방에 참가하면 참여 이벤트가 발생해야 한다.", async () => {
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

describe("퇴장 테스트", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("진행 상태(orderFix, orderCheck)인 경우 나갈 수 없다.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await joinAndReady(service, room.id, userTwoId);
    await service.fixOrder(room.id, userOneId);

    await expect(service.leaveRoom(room.id, userTwoId)).rejects.toThrowError(
      Error
    );
  });

  it("방장은 방에 혼자 있을때만 나갈 수 있다.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await joinAndReady(service, room.id, userTwoId);
    await service.fixOrder(room.id, userOneId);

    await expect(service.leaveRoom(room.id, userOneId)).rejects.toThrowError(
      Error
    );
  });

  it("방에 유저가 모두 나가면 방은 삭제된다.", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);
    await service.leaveRoom(room.id, userTwoId);

    const serviceSpy = jest.spyOn(service, "emit");
    const after = await service.leaveRoom(room.id, userOneId);

    const found = await service.findRoomById(room.id);
    expect(found).toBeUndefined();
    expect(serviceSpy).toBeCalledWith(RoomEventType.DELETED, after);
  });

  it("유저가 나가면 퇴장 이벤트가 발생한다.", async () => {
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

describe("강퇴 테스트", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("레디 안한 유저 강퇴", async () => {
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

  it("레디 한 유저 강퇴", async () => {
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

  it("방장은 강퇴시킬 수 없다.", async () => {
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

  it("OrderFix 상태에서", async () => {
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

describe("강퇴 투표 테스트", () => {
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

  it("생성", async () => {
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

  it("의견 제출", async () => {
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

  it("결과(승인)", async () => {
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
    //TODO 조회 시점에 따라서 강퇴유저가 강퇴처리 되었을수도, 안되었을수도 있음 -> 매번 똑같은결과가 나오지 않음
    const result = await service.getVoteById(vote.id);
    expect(result.finished).toBe(true);
    expect(result.result).toBe(true);
    expect(serviceSpy).toBeCalledWith(RoomEventType.KICK_VOTE_FINISHED, result);
    expect(kickMethod).toBeCalledTimes(1);
  });

  it("결과(거절)", async () => {
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

describe("리셋 투표 테스트", () => {
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

  it("생성", async () => {
    // given
    const room = await prepareFixRoom();
    //when
    const serviceSpy = jest.spyOn(service, "emit");
    const vote = await service.createResetVote(room.id, userOneId);

    //then
    expect(vote).toBeDefined();
    expect(serviceSpy).toBeCalledWith(RoomEventType.RESET_VOTE_CREATED, vote);
  });

  it("결과(승인)", async () => {
    //TODO 투표 조건 수정하기
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

  it("결과(거절)", async () => {
    //TODO 투표 조건 수정하기
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

describe("메뉴 테스트", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await getTestingModule();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("생성", async () => {
    const room = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(room.id, userTwoId);

    // Create
    const created = await service.addMenu(room.id, userTwoId, sampleMenu);
    expect(
      await service.findMenusByParticipant(room.id, userTwoId)
    ).toHaveLength(1);

    expect(created.name).toBe(sampleMenu.name);
  });

  it("수정", async () => {
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

  it("삭제", async () => {
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
