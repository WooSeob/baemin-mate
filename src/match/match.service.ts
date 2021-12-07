import { Inject, Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { Room } from "../domain/room/room";
import { SubscribeCategoryDto } from "./dto/request/subscribe-category.dto";
import { IRoomContainer } from "../core/container/IRoomContainer";
import { Match } from "../domain/match/match";
import { User } from "../user/entity/user.entity";
import { RoomState } from "../domain/room/context/context";

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
    //기존 참여자가 아닐때
    match.room.policy.onlyNotParticipant(user);
    //Order Fix 전에
    match.room.policy.onlyAfterOrderFix();
    //사용자가 참여한 방에 OrderFix ~ OrderDone 단계의 방이 하나라도 있으면 안됨.
    for (let room of user.joinedRooms) {
      room.policy.onlyFor([RoomState.prepare, RoomState.orderDone]);
    }
    match.room.users.add(user);
    return match.room;
  }
}
