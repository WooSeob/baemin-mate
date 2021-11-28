import { Inject, Injectable, Logger } from "@nestjs/common";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Server } from "socket.io";
import { Room } from "src/domain/room/room";

@Injectable()
export class RoomSender {
  // server : namespace</room>
  server: Server = null;
  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {}

  register(room: Room) {
    //유저 입장
    room.users.on("add", (roomUsers) => {});
    //유저 퇴장
    room.users.on("delete", (roomUsers) => {});

    //특정 유저의 메뉴가 추가됨
    room.menus.on("add", () => {});
    //특정 유저의 기존 메뉴 항목 하나가 변경됨
    room.menus.on("update", () => {});
    //특정 유저의 기존 메뉴 항목 하나가 삭제됨
    room.menus.on("delete", () => {});
    //특정 유저의 메뉴 셋 전체가 삭제됨(퇴장한 경우)
    room.menus.on("clean", () => {});

    //방의 금액 정보가 변경됨
    room.price.on("update", () => {});
  }
}
