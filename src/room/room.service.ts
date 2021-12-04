import { Inject, Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Room } from "src/domain/room/room";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { JoinRoomDto } from "./dto/request/join-room.dto";
import { IRoomContainer } from "../core/container/IRoomContainer";
import { Match } from "../domain/match/match";
import { MenuItem } from "../match/interfaces/shop.interface";
import { RoomBuilder } from "../domain/room/room-builder";
import { CheckOrderDto } from "./dto/request/check-order.dto";
import { RoomState } from "../domain/room/context/context";
import { User } from "../user/entity/user.entity";

@Injectable()
export class RoomService {
  public server: Server = null;

  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IRoomContainer") private roomContainer: IRoomContainer
  ) {}

  isParticipant(user: User, room: Room) {
    return room.users.has(user);
  }

  findRoomById(id: string): Room {
    const room = this.roomContainer.findById(id);
    return room;
  }

  getMenus(room: Room) {
    const map: Map<User, MenuItem[]> = new Map();
    for (const user of room.users.getUserList()) {
      map.set(user, room.menus.getMenusByUser(user));
    }
    return map;
  }

  createRoom(purchaser: User, createRoomDto: CreateRoomDto): Room {
    console.log(purchaser);
    if (purchaser.isAlreadyJoined()) {
      throw new Error("already joined another room");
    }

    const room: Room = new RoomBuilder(createRoomDto)
      .setPurchaser(purchaser)
      .build();

    this.roomContainer.push(room);
    return room;
  }

  joinRoom(joinRoomDto: JoinRoomDto): Room {
    const user = this.userContainer.findById(joinRoomDto.userId);
    if (user.isAlreadyJoined()) {
      throw new Error("already joined another room");
    }

    const match: Match = this.matchContainer.findById(joinRoomDto.matchId);
    if (!match) {
      //TODO 만료된 Match 처리
      throw new Error("expired match");
    }
    match.room.users.add(this.userContainer.findById(joinRoomDto.userId));
    return match.room;
  }

  leaveRoom(room: Room, user: User) {
    room.policy.onlyParticipant(user);
    room.policy.onlyFor([RoomState.prepare, RoomState.orderDone]);
    room.users.delete(user);
  }

  getRoomById(id: string) {
    const room = this.roomContainer.findById(id);
    return room;
  }

  closeMatchWait(matchId: string, client: Socket) {
    //인증 필요
    let closed = this.matchContainer.findById(matchId);
    this.matchContainer.delete(closed);
  }

  // only purchaser
  fixOrder(room: Room, user: User) {
    room.policy.onlyBeforeOrderFix();
    room.policy.onlyPurchaser(user);
  }

  checkOrder(room: Room, user: User, checkOrderDto: CheckOrderDto) {
    //TODO 구현하기
    room.policy.onlyForOrderFix();
    room.policy.onlyPurchaser(user);
  }

  doneOrder(room: Room, user: User) {
    //TODO 구현하기
    room.policy.onlyForOrderCheck();
    room.policy.onlyPurchaser(user);
  }

  kick(room: Room, purchaser: User, target: User) {
    // order-fix 이전만 수행 가능
    room.policy.onlyBeforeOrderFix();
    // 방장만 수행 가능한 액션
    room.policy.onlyPurchaser(purchaser);
    // 대상 유저가 같은 방 참여자
    room.policy.onlyParticipant(target);
    //퇴장 처리
    room.users.delete(target);
  }

  //Vote
  createKickVote(room: Room, targetUser: User) {
    // 방 상태는 order-fix 이후 단계
    room.policy.onlyAfterOrderFix();
    // 방 참가자
    room.policy.onlyParticipant(targetUser);
    // target user 가 자기 자신은 아닌지?
    // KickVote 생성
    room.vote.createKickVote(targetUser);
  }

  createResetVote(room: Room) {
    // 방 상태는 order-fix 이후 단계
    room.policy.onlyAfterOrderFix();
    // ResetVote 생성
    room.vote.createResetVote();
  }

  doVote(room: Room, user: User, opinion: boolean) {
    // 방 상태는 order-fix 이후 단계
    room.policy.onlyAfterOrderFix();
    // 참여자만 가능
    room.policy.onlyParticipant(user);
    // 투표 시행
    room.vote.doVote(user, opinion);
  }
}
