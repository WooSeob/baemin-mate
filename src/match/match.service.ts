import { Inject, Injectable, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { Room } from "../domain/room/room";
import { SubscribeCategoryDto } from "./dto/request/subscribe-category.dto";
import { IRoomContainer } from "../core/container/IRoomContainer";
import { Match } from "../domain/match/match";
import { User } from "../user/entity/user.entity";

@Injectable()
export class MatchService {
  public server: Server = null;

  constructor(
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

  findMatchById(id: string): Match {
    return this.matchContainer.findById(id);
  }

  join(match: Match, user: User): Room {
    //Room 은 한순간에 한곳만 참여 가능
    if (user.isAlreadyJoined()) {
      throw new Error("already joined another room");
    }
    match.room.users.add(user);
    return match.room;
  }
}
