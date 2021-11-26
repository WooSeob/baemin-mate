import { Inject, Injectable, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { IUserContainer } from "../core/container/IUserContainer";
import { MatchQueue } from "./domain/impl/MatchQueue";
import { IMatchQueue } from "./domain/interfaces/IMatchQueue";
import { Match, MatchBuilder } from "./domain/match";
import { CreateMatchDto } from "./dto/request/create-match.dto";
import { JoinMatchDto } from "./dto/request/join-match.dto";
import { SubscribeCategoryDto } from "./dto/request/subscribe-category.dto";

@Injectable()
export class MatchService {
  public server: Server = null;

  public matchQueue: IMatchQueue = new MatchQueue();

  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {}

  createMatch(createMatchDto: CreateMatchDto, client: Socket): Match {
    const match: Match = new MatchBuilder(createMatchDto)
      .setPerchaser(this.userContainer.findById(createMatchDto.userId))
      .build();

    this.matchContainer.push(match);

    return match;
  }

  closeMatchWait(matchId: string, client: Socket) {
    //인증 필요
    let closed = this.matchContainer.findById(matchId);
    this.closedMatchContainer.push(closed);
    this.matchContainer.delete(closed);
  }

  destroyMatch(matchId: string, client: Socket) {
    let atContainer = this.matchContainer.findById(matchId);
    if (atContainer) {
      this.matchContainer.delete(atContainer);
      return;
    }

    let atClosed = this.closedMatchContainer.findById(matchId);
    if (atClosed) {
      this.closedMatchContainer.delete(atClosed);
    }
  }

  subscribeByCategory(subscribeCategoryDto: SubscribeCategoryDto, client: Socket) {
    client.join(subscribeCategoryDto.category);
    let matches: Match[] = this.matchContainer.findByCategory(subscribeCategoryDto.category);
    return matches;
  }

  joinMatch(joinMatchDto: JoinMatchDto, client: Socket) {
    let match: Match = this.matchContainer.findById(joinMatchDto.matchId);
    // match.
  }
}
