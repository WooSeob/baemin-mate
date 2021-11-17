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
import { CreateAwaiterDto } from "./dto/creaet-awaiter.dto";
import { Awaiter } from "./domain/awaiter";

@Injectable()
export class MatchService {
  public server: Server = null;

  public matchQueue: IMatchQueue = new MatchQueue();

  constructor(@Inject("IUserContainer") private userContainer: IUserContainer) {}

  getAllMatches(client: Socket) {
    return { action: "getall", status: "ok", data: this.matchQueue.getAll() };
  }
  createMatch(createMatchDto: CreateMatchDto, client: Socket) {
    let match: Match = new MatchBuilder()
      .setShopName(createMatchDto.shopName)
      .setDeliveryPriceAtLeast(createMatchDto.deliveryPriceAtLeast)
      .setDeliveryTipsInterval(createMatchDto.deliveryTipsInterval)
      .setPerchaser(this.userContainer.findById(createMatchDto.userId))
      .setCreateAt(Date.now())
      .build();

    this.matchQueue.matchEnqueue(match);

    client.join(match.shopName);

    match.on("leave", (data) => {});

    match.on("match joined", (data) => {
      //해당 match에 joinUser가 입장함
      let joinUser: User = data.user;
      match.join(joinUser);
      //기존 방 join 브로드 캐스트
      this.server.to(match.shopName).emit("join", { joinUser, match });
    });
    return { action: "create", status: "ok" };
  }

  createAwaiter(createAwaiterDto: CreateAwaiterDto, client: Socket) {
    let awaiter: Awaiter = new Awaiter();
    awaiter.createdAt = Date.now();
    awaiter.user = this.userContainer.findById(createAwaiterDto.userId);

    this.matchQueue.joinerEnqueue(awaiter);

    return { action: "await", status: "ok" };
  }
}
