import { Inject, Injectable, Logger } from "@nestjs/common";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Server } from "socket.io";
import { Room } from "../domain/room/room";
import MatchInfo from "./dto/response/match-info.interface";

@Injectable()
export class MatchSender {
  server: Server = null;
  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {
    // server : namespace</match>
    this.matchContainer.on("push", (match: Room) => {
      this.server.to(match.category).emit("new-arrive", this.toMatchInfo(match));
    });

    this.matchContainer.on("delete", (match: Room) => {
      this.server.to(match.category).emit("closed", this.toMatchInfo(match));
    });
    // MatchInfo에 포함된 멤버가 변경되면 통지해줘야함
    this.matchContainer.on("update-matchInfo", (match: Room) => {
      this.server.to(match.category).emit("update", this.toMatchInfo(match));
    });
  }

  toMatchInfo(match: Room): MatchInfo {
    return {
      id: match.id,
      shopName: match.shopName,
      section: match.targetSection,
      total: match.totalPrice,
      tip: match.deliveryTip,
    };
  }
}
