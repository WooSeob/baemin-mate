import { Inject, Injectable, Logger } from "@nestjs/common";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "src/core/container/IUserContainer";
import { Server } from "socket.io";
import { Match } from "./domain/match";
import MatchInfo from "./interfaces/response/match-info.interface";

@Injectable()
export class MatchSender {
  server: Server = null;
  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {
    this.matchContainer.on("push", (match: Match) => {
      this.server.to(match.category).emit("new-arrive", this.newMatchArrived(match));
    });

    this.matchContainer.on("delete", (match: Match) => {
      this.server.to(match.category).emit("closed", this.deleted(match));
    });
  }

  newMatchArrived(match: Match): MatchInfo {
    let newMatchInfo: MatchInfo = {
      id: match.id,
      shopName: match.shopName,
      section: match.targetSection,
      total: match.totalPrice,
      tip: match.deliveryTip,
    };
    return newMatchInfo;
  }

  deleted(match: Match): MatchInfo {
    let closedMatchInfo: MatchInfo = {
      id: match.id,
      shopName: match.shopName,
      section: match.targetSection,
      total: match.totalPrice,
      tip: match.deliveryTip,
    };
    return closedMatchInfo;
  }
}
