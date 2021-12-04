import { Inject, Injectable, Logger } from "@nestjs/common";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Server } from "socket.io";
import MatchInfo from "./dto/response/match-info.interface";
import { Match } from "../domain/match/match";

@Injectable()
export class MatchSender {
  server: Server = null;
  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {
    // server : namespace</match>
    this.matchContainer.on("push", (match: Match) => {
      // MatchInfo에 포함된 멤버가 변경되면 통지해줘야함
      match.on("update", (updatedMatch) => {
        console.log("/match-update");
        this.server
          .to(match.info.category)
          .emit("update", this.toMatchInfo(updatedMatch));
      });
      this.server
        .to(match.info.category)
        .emit("new-arrive", this.toMatchInfo(match));
    });

    this.matchContainer.on("delete", (match: Match) => {
      this.server
        .to(match.info.category)
        .emit("closed", this.toMatchInfo(match));
    });
  }

  toMatchInfo(match: Match): MatchInfo {
    return {
      id: match.id,
      shopName: match.info.shopName,
      section: match.info.section,
      total: match.totalPrice,
      priceAtLeast: match.atLeast,
      purchaserName: match.info.purchaser.name,
      createdAt: match.info.createdAt,
    };
  }
}
