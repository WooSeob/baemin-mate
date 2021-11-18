import { Inject, Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { IMatchContainer } from "src/core/container/IMatchContainer";
import { SECTION } from "src/user/interfaces/user";
import { IUserContainer } from "../core/container/IUserContainer";
import { MatchQueue } from "./domain/impl/MatchQueue";
import { IMatchQueue } from "./domain/interfaces/IMatchQueue";
import { Match, MatchBuilder } from "./domain/match";
import { CreateMatchDto } from "./dto/create-match.dto";
import { JoinMatchDto } from "./dto/join-match.dto";
import { SubscribeCategoryDto } from "./dto/subscribe-category.dto";
import { CATEGORY } from "./interfaces/category.interface";

@Injectable()
export class MatchService {
  public server: Server = null;

  public matchQueue: IMatchQueue = new MatchQueue();

  constructor(
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IMatchContainer") private closedMatchContainer: IMatchContainer
  ) {}

  createMatch(createMatchDto: CreateMatchDto, client: Socket) {
    let match: Match = new MatchBuilder()
      .setShopName(createMatchDto.shopName)
      .setDeliveryPriceAtLeast(createMatchDto.deliveryPriceAtLeast)
      .setDeliveryTipsInterval(createMatchDto.deliveryTipsInterval)
      .setPerchaser(this.userContainer.findById(createMatchDto.userId))
      .setCategory(createMatchDto.category)
      .setSection(createMatchDto.section)
      .build();

    this.matchContainer.push(match);

    //해당 카테고리를 구독중인 클라이언트들에게 새로운 match가 있음을 통지
    this.server.to(match.targetSection).emit("new-arrive", match);

    return { action: "create", status: "ok" };
  }

  closeMatchWait(matchId: string, client: Socket) {
    //인증 필요
    let closed = this.matchContainer.findById(matchId);
    this.closedMatchContainer.push(closed);

    //해당 카테고리를 구독중인 클라이언트들에게 기존 match가 종료되었음을 통지
    this.server.to(closed.targetSection).emit("closed", closed);
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
