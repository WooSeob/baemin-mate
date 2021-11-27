import { Inject, Injectable, Logger } from "@nestjs/common";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Server } from "socket.io";
import { Room } from "src/domain/room/room";
import { User } from "src/user/interfaces/user";

@Injectable()
export class RoomSender {
  // server : namespace</room>
  server: Server = null;
  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {}

  register(match: Room) {
    match.on("new-user-join", (user: User) => {
      this.server.to(match.id).emit("");
    });
    match.on("user-leave", (user: User) => {
      this.server.to(match.id).emit("");
    });
    match.on("update-total", (price: number) => {
      this.server.to(match.id).emit("");
    });
    match.on("update-menu", (user: User, match: Room) => {
      this.server.to(match.id).emit("");
    });
  }
}
