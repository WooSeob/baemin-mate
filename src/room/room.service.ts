import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Room } from "src/domain/room/room";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { IRoomContainer } from "../core/container/IRoomContainer";
import { MenuItem } from "../match/interfaces/shop.interface";
import { RoomBuilder } from "../domain/room/room-builder";
import { CheckOrderDto } from "./dto/request/check-order.dto";
import { RoomState } from "../domain/room/context/context";
import { User } from "../user/entity/user.entity";
import { RoomSender } from "./room.sender";

@Injectable()
export class RoomService {
  public server: Server = null;
  private logger = new Logger("RoomService");
  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IRoomContainer") private roomContainer: IRoomContainer,
    private roomSender: RoomSender
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
    //사용자가 참여한 방에 OrderFix ~ OrderDone 단계의 방이 하나라도 있으면 안됨.
    for (let room of purchaser.joinedRooms) {
      room.policy.onlyFor([RoomState.prepare, RoomState.orderDone]);
    }

    const room: Room = new RoomBuilder(createRoomDto).setPurchaser(purchaser).build();

    this.roomContainer.push(room);
    this.logger.log(`Room - ${room.info.shopName}(${room.id}) created`);
    this.roomSender.register(room);
    if (Reflect.has(purchaser, "socket")) {
      (Reflect.get(purchaser, "socket") as Socket).join(room.id);
    }
    return room;
  }

  leaveRoom(room: Room, user: User) {
    // 방 참여자만 나갈 수 있음
    room.policy.onlyParticipant(user);
    // prepare || orderDone 상태에만 나갈 수 있음
    room.policy.onlyFor([RoomState.prepare, RoomState.orderDone]);
    // ready == false 일때만 나갈 수 있음.
    room.policy.onlyNotReady(user);

    // 방장은 참여자가 1명 일때만 나갈 수 있음.
    if (user == room.info.purchaser && room.users.getUserCount() > 1){
      throw new HttpException(
          "purchaser can leave when there is only one participant in the room.",
          HttpStatus.BAD_REQUEST
      );
    }

    //나가기 처리
    if (Reflect.has(user, "socket")) {
      (Reflect.get(user, "socket") as Socket).leave(room.id);
    }
    room.users.delete(user);

    //모두 나가면 방 삭제
    if (room.users.getUserCount() == 0){
      this.roomContainer.delete(room);
    }
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
    //TODO ALL ready시에만 가능
    room.order.fix();
  }

  checkOrder(room: Room, user: User, checkOrderDto: CheckOrderDto) {
    //TODO 구현하기
    room.policy.onlyForOrderFix();
    room.policy.onlyPurchaser(user);
    if (!room.order.screenshotUploaded) {
      throw new HttpException("screenshot not uploaded", HttpStatus.BAD_REQUEST);
    }
    room.price.updateTip(checkOrderDto.tip);
    room.order.check();
  }

  doneOrder(room: Room, user: User) {
    //TODO 구현하기
    room.policy.onlyForOrderCheck();
    room.policy.onlyPurchaser(user);
    room.order.done();
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
  createKickVote(room: Room, targetUser: User): string {
    // 방 상태는 order-fix 이후 단계
    room.policy.onlyAfterOrderFix();
    // 방 참가자
    room.policy.onlyParticipant(targetUser);
    // target user 가 자기 자신은 아닌지?
    // KickVote 생성
    room.vote.createKickVote(targetUser);
    return room.vote.vid;
  }

  createResetVote(room: Room): string {
    // 방 상태는 order-fix 이후 단계
    room.policy.onlyAfterOrderFix();
    // ResetVote 생성
    room.vote.createResetVote();
    return room.vote.vid;
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
