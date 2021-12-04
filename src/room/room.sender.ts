import { Inject, Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";
import { Room } from "src/domain/room/room";

@Injectable()
export class RoomSender {
  // server : namespace</room>
  server: Server = null;
  constructor() {}

  register(room: Room) {
    //유저 입장
    room.users.on("add", (roomUsers) => {
      this.server.to(room.id).emit("users-new");
    });
    //유저 퇴장
    room.users.on("delete", (roomUsers) => {
      this.server.to(room.id).emit("users-leave");
    });
    //모두 레디함
    room.users.on("all-ready", () => {});

    //특정 유저의 메뉴가 추가됨
    room.menus.on("add", () => {
      this.server.to(room.id).emit("menus-added");
    });
    //특정 유저의 기존 메뉴 항목 하나가 변경됨
    room.menus.on("update", () => {
      this.server.to(room.id).emit("menus-updated");
    });
    //특정 유저의 기존 메뉴 항목 하나가 삭제됨
    room.menus.on("delete", () => {
      this.server.to(room.id).emit("menus-deleted");
    });
    //특정 유저의 메뉴 셋 전체가 삭제됨(퇴장한 경우)
    room.menus.on("clean", () => {
      this.server.to(room.id).emit("menus-cleared");
    });

    //방의 금액 정보가 변경됨
    room.price.on("update", () => {
      this.server.to(room.id).emit("price-updated");
    });

    //강퇴 투표가 시작됨
    room.vote.on("created-kick", () => {
      this.server.to(room.id).emit("vote-kick-created");
    });
    //리셋 투표가 시작됨
    room.vote.on("created-reset", () => {
      this.server.to(room.id).emit("vote-reset-created");
    });
    //투표 결과가 나옴
    room.vote.on("finish", () => {
      this.server.to(room.id).emit("vote-finished");
    });

    //모두 레디가 되어 방장이 order를 fix함
    room.order.on("fix", () => {
      this.server.to(room.id).emit("order-fixed");
    });
    //방장이 결제 직전 정보를 업로드 함
    room.order.on("check", () => {
      this.server.to(room.id).emit("order-checked");
    });
    //방장이 결제를 성사함(배달 시작)
    room.order.on("done", () => {
      this.server.to(room.id).emit("order-finished");
    });

    room.chat.on("receive", (message) => {
      this.server.to(room.id).emit("chat", message);
    });
  }
}
