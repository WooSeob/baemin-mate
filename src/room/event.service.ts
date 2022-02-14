import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";

import { ChatBody, Message, SystemBody } from "./dto/response/message.response";
import { RoomService } from "./room.service";
import { Room } from "../entities/Room";

interface RoomEvent {
  resolve(roomService: RoomService);
}
class KickVoteFinishedEvent implements RoomEvent {
  readonly roomId!: string;
  readonly targetId!: string;
  readonly kicked?: string;
  resolve(roomService: RoomService) {
    roomService.kickUserByVote(this.roomId, this.targetId);
  }
}

/**
 * 채팅을 보내야 하는 이벤트
 * - 유저 입장 userid
 * - 유저 퇴장 userid
 * - 유저 강퇴
 * - 모두 레디
 * - 모두 레디 취소
 * - 오더 픽스
 * - 오더 체크
 * - 오더 돈
 * - 강퇴 투표 생성 voteid
 * - 강퇴 푸표 종료
 * - 리셋 투표 생성
 * - 리셋 투표 종료
 *
 * */

@Injectable()
export class EventService {
  server: Server;
  private logger = new Logger("RoomSender");
  constructor() {
    // super();
    // this.on("created", (room) => {
    //   console.log(`<created> ${room.id}`);
    //   // this.emit("created", room);
    // });
  }

  register(room: Room) {
    //유저 입장
    // room.users.on("add", (user: User) => {
    //   const res = UserJoinedResponse.from(user);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'users-new' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // //유저 퇴장
    // room.users.on("delete", (user: User) => {
    //   const res = UserLeaveResponse.from(user);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'users-leave' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // //모두 레디함
    // room.users.on("all-ready", (roomUsers: RoomUsers) => {
    //   const res = UserAllReadyResponse.from(roomUsers);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'all-ready' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // //특정 유저의 메뉴가 추가됨
    // room.menus.on("add", () => {
    //   this.server.to(room.id).emit("menus-added");
    // });
    // //특정 유저의 기존 메뉴 항목 하나가 변경됨
    // room.menus.on("update", () => {
    //   this.server.to(room.id).emit("menus-updated");
    // });
    // //특정 유저의 기존 메뉴 항목 하나가 삭제됨
    // room.menus.on("delete", () => {
    //   this.server.to(room.id).emit("menus-deleted");
    // });
    // //특정 유저의 메뉴 셋 전체가 삭제됨(퇴장한 경우)
    // room.menus.on("clean", () => {
    //   this.server.to(room.id).emit("menus-cleared");
    // });
    //방의 금액 정보가 변경됨
    // room.price.on("update", () => {
    //   this.server.to(room.id).emit("price-updated");
    //   this.logger.log(
    //     `'price-updated' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    //강퇴 투표가 시작됨
    // //TODO interface 따로 만들기
    // room.vote.on("created-kick", (kickVote: KickVote) => {
    //   const res = KickVoteCreatedResponse.from(kickVote);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'vote-kick-created' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // //리셋 투표가 시작됨
    // room.vote.on("created-reset", (resetVote: ResetVote) => {
    //   const res = ResetVoteCreatedResponse.from(resetVote);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'vote-reset-created' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // //강퇴 투표 결과가 나옴
    // room.vote.on("kick-finish", (kickVote: KickVote) => {
    //   const res = KickVoteFinishedResponse.from(kickVote);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'vote-finished' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // //리셋 투표 결과가 나옴
    // room.vote.on("reset-finish", (resetVote: ResetVote) => {
    //   const res = ResetVoteFinishedResponse.from(resetVote);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'vote-finished' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    //
    // //모두 레디가 되어 방장이 order를 fix함
    // room.order.on("fix", (roomOrder: RoomOrder) => {
    //   const res = OrderFixedResponse.from(roomOrder);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'order-fixed' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // //방장이 결제 직전 정보를 업로드 함
    // room.order.on("check", (roomOrder: RoomOrder) => {
    //   //TODO 구현
    //   const res = OrderCheckedResponse.from(roomOrder);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'order-checked' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // //방장이 결제를 성사함(배달 시작)
    // room.order.on("done", (roomOrder: RoomOrder) => {
    //   const res = OrderDoneResponse.from(roomOrder);
    //   this.server.to(room.id).emit(res.action, res.data);
    //   this.logger.log(
    //     `'order-finished' broadcast to Room(${room.info.shopName}#${room.id})`
    //   );
    // });
    // room.chat.on("receive", (message: Message<ChatBody | SystemBody>) => {
    //   this.server.to(room.id).emit("chat", {
    //     rid: room.id,
    //     messages: [message],
    //   });
    // });
  }
}
