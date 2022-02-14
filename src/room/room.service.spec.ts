import { Test, TestingModule } from "@nestjs/testing";
import { RoomService } from "./room.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Room } from "../entities/Room";

import { CreateRoomDto } from "./dto/request/create-room.dto";
import { User } from "../user/entity/user.entity";
import { EmailAuth } from "../auth/entity/email-auth.entity";
import { Participant } from "../entities/Participant";
import { Menu } from "../entities/Menu";
import { Match } from "../entities/Match";
import { ImageFile } from "../entities/ImageFile";
import { AddMenuDto } from "../user/dto/request/add-menu.dto";
import { RoomState } from "../entities/RoomState";
import RoomBlackList from "../entities/RoomBlackList";
import RoomVote from "../entities/RoomVote";
import VoteOpinion from "../entities/VoteOpinion";
import { EventService } from "./event.service";
import RoomChat from "../entities/RoomChat";
import { db } from "../../config";

let connection;
const mockConnection = () => ({
  transaction: jest.fn(),
});

describe("RoomService", () => {
  let service: RoomService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(db),
        TypeOrmModule.forFeature([Room, Participant, Menu, User]),
      ],
      providers: [RoomService],
    }).compile();

    service = module.get<RoomService>(RoomService);
    await service.clear();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it("should be defined", () => {
    expect(service.connection).toBeDefined();
  });

  it("레디 테스트", async () => {
    const purchaser: User = new User();
    purchaser.id = "SjnUHiH9NfWidFhhnCiZ1JgjKsriQ_7H9NFW3gPZJQc";
    const room = await service.createRoom(purchaser.id, createRoomDto);
    const roomId = room.id;
    expect((await service.findRoomById(roomId)).getUserCount()).toBe(1);

    await service.joinRoom(roomId, "abc");
    expect((await service.findRoomById(roomId)).getUserCount()).toBe(2);
    await service.setReady(roomId, "abc", true);
    expect((await service.findRoomById(roomId)).phase).toBe(
      RoomState.ALL_READY
    );

    await service.joinRoom(roomId, "xyz");
    expect((await service.findRoomById(roomId)).phase).toBe(RoomState.PREPARE);
    expect((await service.findRoomById(roomId)).getUserCount()).toBe(3);
    await service.setReady(roomId, "xyz", true);
    expect((await service.findRoomById(roomId)).phase).toBe(
      RoomState.ALL_READY
    );

    await service.setReady(roomId, "xyz", false);
    expect((await service.findRoomById(roomId)).phase).toBe(RoomState.PREPARE);

    // await service.leaveRoom(roomId, "xyz");
    // expect((await service.findRoomById(roomId)).phase).toBe(
    //   RoomState.ALL_READY
    // );

    await service.setReady(roomId, "abc", false);
    await service.leaveRoom(roomId, "abc");
    expect((await service.findRoomById(room.id)).getUserCount()).toBe(2);
    console.log(await service.findRoomById(roomId));
  });

  it("생성 테스트 - 이미 다른 방 참여", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);

    try {
      // when
      await service.createRoom(userTwoId, createRoomDto);
      expect(false).toBe(true);
    } catch (e) {
      // then
      console.log(e.message);
      expect(e.message).toBe("cant do at phase");
    }
  });

  it("생성 테스트 - 이미 다른 방 방장", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    const secondRoom = await service.createRoom(userTwoId, createRoomDto);

    try {
      // when
      await service.createRoom(userTwoId, createRoomDto);
      expect(false).toBe(true);
    } catch (e) {
      // then
      console.log(e.message);
      expect(e.message).toBe("cant do at phase");
    }
  });

  it("참가 테스트 - 이미 다른 방 방장", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    const secondRoom = await service.createRoom(userTwoId, createRoomDto);

    try {
      // when
      await service.joinRoom(secondRoom.id, userOneId);
      expect(false).toBe(true);
    } catch (e) {
      //then
      expect(e.message).toBe("cant do at phase");
    }
  });

  it("참가 테스트 - 이미 다른 방 레디", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    const secondRoom = await service.createRoom(userTwoId, createRoomDto);
    await service.joinRoom(firstRoom.id, userThreeId);
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

  it("참가 테스트 - 강퇴 이력이 있는 유저", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.kick(firstRoom.id, userOneId, userTwoId);

    try {
      // when
      await service.joinRoom(firstRoom.id, userTwoId);
      expect(false).toBe(true);
    } catch (e) {
      //then
      expect(e.message).toBe("강제퇴장 당한 이용자 입니다.");
    }
  });

  it("강퇴 테스트 - 레디 안한 유저", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);

    //when
    await service.kick(firstRoom.id, userOneId, userTwoId);

    //then
    expect(
      (await service.findRoomById(firstRoom.id)).isParticipant(userTwoId)
    ).toBe(false);
  });

  it("강퇴 테스트 - 레디 한 유저", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.setReady(firstRoom.id, userTwoId, true);

    //when
    await service.kick(firstRoom.id, userOneId, userTwoId);

    //then
    expect(
      (await service.findRoomById(firstRoom.id)).isParticipant(userTwoId)
    ).toBe(false);
  });

  it("강퇴 테스트 - OrderFix 상태에서", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.setReady(firstRoom.id, userTwoId, true);
    await service.fixOrder(firstRoom.id, userOneId);

    console.log(await service.findRoomById(firstRoom.id));

    try {
      //when
      await service.kick(firstRoom.id, userOneId, userTwoId);
      expect(false).toBe(true);
    } catch (e) {
      //then
      expect(e.message).toBe("cant do at phase");
    }
  });

  it("강퇴 투표 - 생성", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.setReady(firstRoom.id, userTwoId, true);
    await service.joinRoom(firstRoom.id, userThreeId);
    await service.setReady(firstRoom.id, userThreeId, true);
    await service.fixOrder(firstRoom.id, userOneId);

    //when
    const created = await service.createKickVote(firstRoom.id, userTwoId);

    console.log(created);
    //then
    expect(created.targetUserId).toBe(userTwoId);
  });

  it("강퇴 투표 - 의견 제출", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.setReady(firstRoom.id, userTwoId, true);
    await service.joinRoom(firstRoom.id, userThreeId);
    await service.setReady(firstRoom.id, userThreeId, true);
    await service.fixOrder(firstRoom.id, userOneId);
    const vote = await service.createKickVote(firstRoom.id, userTwoId);

    //when
    await service.doVote(vote.id, userThreeId, true);
    //then
    // expect(created.target.userId).toBe(userTwoId);
    expect(true).toBe(true);
  });

  it("강퇴 투표 - 결과(승인)", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.setReady(firstRoom.id, userTwoId, true);
    await service.joinRoom(firstRoom.id, userThreeId);
    await service.setReady(firstRoom.id, userThreeId, true);
    await service.fixOrder(firstRoom.id, userOneId);
    const vote = await service.createKickVote(firstRoom.id, userTwoId);

    //when
    await service.doVote(vote.id, userOneId, true);
    await service.doVote(vote.id, userThreeId, true);

    //then
    const result = await service.getRoomVotes(firstRoom.id);
    console.log(result);
    expect(result[0].finished).toBe(true);
    expect(result[0].result).toBe(true);
  });

  it("강퇴 투표 - 결과(거절)", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.setReady(firstRoom.id, userTwoId, true);
    await service.joinRoom(firstRoom.id, userThreeId);
    await service.setReady(firstRoom.id, userThreeId, true);
    await service.fixOrder(firstRoom.id, userOneId);
    const vote = await service.createKickVote(firstRoom.id, userTwoId);

    //when
    await service.doVote(vote.id, userOneId, false);
    await service.doVote(vote.id, userThreeId, true);

    //then
    const result = await service.getRoomVotes(firstRoom.id);
    console.log(result);
    expect(result[0].finished).toBe(true);
    expect(result[0].result).toBe(false);
  });

  it("리셋 투표 - 생성", async () => {
    // given
    const firstRoom = await service.createRoom(userOneId, createRoomDto);
    await service.joinRoom(firstRoom.id, userTwoId);
    await service.setReady(firstRoom.id, userTwoId, true);
    await service.joinRoom(firstRoom.id, userThreeId);
    await service.setReady(firstRoom.id, userThreeId, true);
    await service.fixOrder(firstRoom.id, userOneId);
    const vote = await service.createResetVote(firstRoom.id);

    //when
    await service.doVote(vote.id, userThreeId, true);
    //then
    // expect(created.target.userId).toBe(userTwoId);
    expect(true).toBe(true);
  });

  // it("트랜잭션 테스트", async () => {
  //   const purchaser: User = new User();
  //   purchaser.id = "SjnUHiH9NfWidFhhnCiZ1JgjKsriQ_7H9NFW3gPZJQc";
  //   const dto: CreateRoomDto = {
  //     shopName: "testshop",
  //     deliveryPriceAtLeast: 200,
  //     shopLink: "asdf",
  //     category: "korean",
  //     section: "Narae",
  //   };
  //   const room = await service.createRoom(purchaser.id, dto);
  //   const roomId = room.id;
  //   expect((await service.findRoomById(roomId)).getUserCount()).toBe(1);
  //
  //   await service.joinRoom(roomId, "abc");
  //   await service.joinRoom(roomId, "xyz");
  //   service.setReady(roomId, "xyz", true);
  //   service.setReady(roomId, "abc", true);
  //   await aFewSecondsLater(200);
  //   service.fixOrder(roomId, "");
  //
  //   try {
  //     //에러 뱉어야 성공
  //     service.setReady(roomId, "xyz", false);
  //
  //     await aFewSecondsLater(1500);
  //     expect(true).toBe(false);
  //   } catch (e) {
  //     expect(e.message).toBe("cant do at phase");
  //   }
  // });

  it("메뉴 CRUD 테스트", async () => {
    const purchaser: User = new User();
    purchaser.id = "SjnUHiH9NfWidFhhnCiZ1JgjKsriQ_7H9NFW3gPZJQc";
    const dto: CreateRoomDto = {
      shopName: "testshop",
      deliveryPriceAtLeast: 200,
      shopLink: "asdf",
      category: "korean",
      section: "Narae",
    };
    const room = await service.createRoom(purchaser.id, dto);
    const roomId = room.id;

    await service.joinRoom(roomId, "abc");

    // Create
    const created = await service.addMenu(roomId, "abc", sampleMenu);
    expect(await service.findMenusByParticipant(roomId, "abc")).toHaveLength(1);

    expect(created.name).toBe(sampleMenu.name);

    // // Update
    // await service.updateMenu(roomId, "abc", created.id, sampleMenu2);
    // expect(await service.findMenusByParticipant(roomId, "abc")).toHaveLength(1);
    // const updated = await service.findMenuByParticipant(
    //   roomId,
    //   "abc",
    //   created.id
    // );
    // expect(updated.name).toBe(sampleMenu2.name);
    //
    // // Delete
    // await service.deleteMenu(roomId, "abc", created.id);
    // expect(await service.findMenusByParticipant(roomId, "abc")).toHaveLength(0);
  });
});

const userOneId = "SjnUHiH9NfWidFhhnCiZ1JgjKsriQ_7H9NFW3gPZJQc";
const userTwoId = "abc";
const userThreeId = "xyz";
const userFourId = "qwer";

const createRoomDto: CreateRoomDto = {
  shopName: "testshop",
  deliveryPriceAtLeast: 200,
  shopLink: "asdf",
  category: "korean",
  section: "Narae",
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

const aFewSecondsLater = (ms) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(1);
    }, ms);
  });
};
