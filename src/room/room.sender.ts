import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";
import { Room } from "src/domain/room/room";
import RoomUserView from "./dto/response/user-view.dto";
import { User } from "../user/entity/user.entity";
import ResetVote from "../domain/room/vote/ResetVote";
import KickVote from "../domain/room/vote/KickVote";
import {
  UserAllReadyResponse,
  UserJoinedResponse,
  UserLeaveResponse,
} from "./dto/response/users.response";
import RoomUsers from "../domain/room/users/users";
import {
  KickVoteCreatedResponse,
  KickVoteFinishedResponse,
  ResetVoteCreatedResponse,
  ResetVoteFinishedResponse,
} from "./dto/response/vote.response";
import RoomOrder from "../domain/room/order/order";
import {
  OrderCheckedResponse,
  OrderDoneResponse,
  OrderFixedResponse,
} from "./dto/response/order.response";
import { ChatBody, Message, SystemBody } from "./dto/response/message.response";

@Injectable()
export class RoomSender {
  // server : namespace</room>
  server: Server = null;
  private logger = new Logger("RoomSender");
  constructor() {}

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

    room.chat.on("receive", (message: Message<ChatBody | SystemBody>) => {
      this.server.to(room.id).emit("chat", {
        rid: room.id,
        messages: [message],
      });
    });
  }
}
