import { Inject, Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { DeleteMenuDto } from "./dto/request/delete-menu.dto";
import { InitDto } from "./dto/request/init.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";

@Injectable()
export class RoomService {
  public server: Server = null;

  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {}

  getRoomData(initDto: InitDto) {
    const match = this.matchContainer.findById(initDto.matchId);
    return match;
  }

  addMenu(addMenuDto: AddMenuDto) {
    const match = this.matchContainer.findById(addMenuDto.matchId);
    match.addMenu(this.userContainer.findById(addMenuDto.userId), addMenuDto.menu);
  }

  updateMenu(updateMenuDto: UpdateMenuDto) {}

  deleteMenu(deleteMenuDto: DeleteMenuDto) {}
}
