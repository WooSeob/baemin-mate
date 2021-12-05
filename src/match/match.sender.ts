import { Inject, Injectable, Logger } from "@nestjs/common";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { Server } from "socket.io";
import MatchInfo from "./dto/response/match-info.interface";
import { Match } from "../domain/match/match";

@Injectable()
export class MatchSender {
  private logger = new Logger("MatchSender");
  server: Server = null;
  constructor(
    @Inject("IMatchContainer") private matchContainer: IMatchContainer
  ) {
    // server : namespace</match>
    this.matchContainer.on("push", (match: Match) => {
      // MatchInfo에 포함된 멤버가 변경되면 통지해줘야함

      match.on("update", (updatedMatch) => {
        this.server
          .to(match.info.category)
          .emit("update", this.toMatchInfo(updatedMatch));
        this.logger.log(`'update' broadcast to ${match.info.category}`);
      });
      this.server
        .to(match.info.category)
        .emit("new-arrive", this.toMatchInfo(match));
      this.logger.log(`'new-arrive' broadcast to ${match.info.category}`);
    });

    this.matchContainer.on("delete", (match: Match) => {
      this.server
        .to(match.info.category)
        .emit("closed", this.toMatchInfo(match));
      this.logger.log(`'closed' broadcast to ${match.info.category}`);
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
