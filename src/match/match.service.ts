import { Inject, Injectable, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "../core/container/IUserContainer";
import { Room } from "../domain/room/room";
import { SubscribeCategoryDto } from "./dto/request/subscribe-category.dto";
import { IRoomContainer } from "../core/container/IRoomContainer";
import { Match } from "../domain/match/match";

@Injectable()
export class MatchService {
  public server: Server = null;

  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IRoomContainer") private roomContainer: IRoomContainer
  ) {
    roomContainer.on("push", (room: Room) => {
      this.matchContainer.push(new Match(room));
    });
    roomContainer.on("delete", (room: Room) => {
      room.matches.forEach((match) => {
        this.matchContainer.delete(match);
      });
    });
  }

  subscribeByCategory(
    subscribeCategoryDto: SubscribeCategoryDto,
    client: Socket
  ) {
    client.join(subscribeCategoryDto.category);
    let matches: Match[] = this.matchContainer.findByCategory(
      subscribeCategoryDto.category
    );
    return matches;
  }
}
