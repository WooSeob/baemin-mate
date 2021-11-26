import { Inject, Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Match, MatchBuilder } from "src/match/domain/match";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { DeleteMenuDto } from "./dto/request/delete-menu.dto";
import { JoinRoomDto } from "./dto/request/join-room.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";

@Injectable()
export class RoomService {
  public server: Server = null;

  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {}

  createRoom(createRoomDto: CreateRoomDto): Match {
    const match: Match = new MatchBuilder(createRoomDto)
      .setPerchaser(this.userContainer.findById(createRoomDto.userId))
      .build();

    this.matchContainer.push(match);

    return match;
  }

  joinRoom(joinRoomDto: JoinRoomDto): Match {
    const match: Match = this.matchContainer.findById(joinRoomDto.matchId);
    return match;
  }

  getRoomById(id: string) {
    const room = this.matchContainer.findById(id);
    return room;
  }

  addMenu(addMenuDto: AddMenuDto) {
    const match = this.matchContainer.findById(addMenuDto.matchId);
    match.addMenu(this.userContainer.findById(addMenuDto.userId), addMenuDto.menu);
  }

  updateMenu(updateMenuDto: UpdateMenuDto) {}

  deleteMenu(deleteMenuDto: DeleteMenuDto) {}
}
