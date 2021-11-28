import { Inject, Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Room, MatchBuilder } from "src/domain/room/room";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { DeleteMenuDto } from "./dto/request/delete-menu.dto";
import { JoinRoomDto } from "./dto/request/join-room.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";
import { IRoomContainer } from "../core/container/IRoomContainer";
import { Match } from "../domain/match/match";

@Injectable()
export class RoomService {
  public server: Server = null;

  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IRoomContainer") private roomContainer: IRoomContainer
  ) {}

  createRoom(createRoomDto: CreateRoomDto): Room {
    const room: Room = new MatchBuilder(createRoomDto)
      .setPerchaser(this.userContainer.findById(createRoomDto.userId))
      .build();

    this.roomContainer.push(room);
    return room;
  }

  joinRoom(joinRoomDto: JoinRoomDto): Room {
    const match: Match = this.matchContainer.findById(joinRoomDto.matchId);
    if (!match) {
      //TODO 만료된 Match 처리
    }
    match.room.users.add(this.userContainer.findById(joinRoomDto.userId));
    return match.room;
  }

  getRoomById(id: string) {
    const room = this.roomContainer.findById(id);
    return room;
  }

  addMenu(addMenuDto: AddMenuDto) {
    const room = this.roomContainer.findById(addMenuDto.roomId);
    room.menus.add(
      this.userContainer.findById(addMenuDto.userId),
      addMenuDto.menu
    );
  }

  updateMenu(updateMenuDto: UpdateMenuDto) {}

  deleteMenu(deleteMenuDto: DeleteMenuDto) {}

  closeMatchWait(matchId: string, client: Socket) {
    //인증 필요
    let closed = this.matchContainer.findById(matchId);
    this.matchContainer.delete(closed);
  }
}
