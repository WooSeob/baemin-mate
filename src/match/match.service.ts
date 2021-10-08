import { Inject, Injectable } from "@nestjs/common";
import { WsResponse } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { User } from "../user/interfaces/user";
import { IUserContainer } from "../core/container/IUserContainer";
import { UserContainer } from "../core/container/UserContainer";
import { MatchQueue } from "./domain/impl/MatchQueue";
import { IMatchQueue } from "./domain/interfaces/IMatchQueue";
import { Match, MatchBuilder } from "./domain/match";
import { CreateMatchDto } from "./dto/create-match.dto";

@Injectable()
export class MatchService {
  public server: Server = null;

  public matchQueue: IMatchQueue = new MatchQueue();

  constructor(@Inject("IUserContainer") private userContainer: IUserContainer) {}

  createMatch(createMatchDto: CreateMatchDto, client: Socket) {
    let match: Match = new MatchBuilder()
      .setShopName(createMatchDto.shopName)
      .setDeliveryPriceAtLeast(createMatchDto.deliveryPriceAtLeast)
      .setDeliveryTipsInterval(createMatchDto.deliveryTipsInterval)
      .setPerchaser(this.userContainer.findById(createMatchDto.userId))
      .build();

    this.matchQueue.matchEnqueue(match);

    return { action: "create", status: "ok" };
  }
}
