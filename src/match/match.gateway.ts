import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  WsResponse,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Inject, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { MatchService } from "./match.service";
import { CreateMatchDto } from "./dto/create-match.dto";
import { SubscribeCategoryDto } from "./dto/subscribe-category.dto";
import { JoinMatchDto } from "./dto/join-match.dto";
import { Match } from "./domain/match";
import { IUserContainer } from "src/core/container/IUserContainer";

@WebSocketGateway({ namespace: "/match", cors: { origin: "*" } })
export class MatchGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private matchService: MatchService,
    @Inject("IUserContainer") private userContainer: IUserContainer
  ) {}

  @WebSocketServer() public server: Server;
  private logger: Logger = new Logger("MatchGateway");

  afterInit(server: Server) {
    this.matchService.server = server;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(client.handshake.auth); // prints { token: "abcd" }
    // console.log("MatchGateway-connection!!", client.id);
  }

  @SubscribeMessage("create")
  create(
    @MessageBody() createMatchDto: CreateMatchDto,
    @ConnectedSocket() client: Socket
  ): WsResponse<any> {
    return {
      event: "create",
      data: this.matchService.createMatch(createMatchDto, client),
    };
  }

  @SubscribeMessage("subscribe")
  subscribe(
    @MessageBody() subscribeCategoryDto: SubscribeCategoryDto,
    @ConnectedSocket() client: Socket
  ): MatchSubscribeAck {
    if (
      client.handshake.auth.token !=
      this.userContainer.findById(subscribeCategoryDto.userId).sessionId
    ) {
      console.log(this.userContainer.findById(subscribeCategoryDto.userId).sessionId);
      return {
        status: 401,
        data: [],
      };
    }
    let matches: Match[] = this.matchService.subscribeByCategory(subscribeCategoryDto, client);
    return {
      status: 200,
      data: matches.map((match): MatchInfo => {
        return {
          id: match.id,
          shopName: match.shopName,
          section: match.targetSection,
          total: match.totalPrice,
          tip: match.deliveryTip,
        };
      }),
    };
  }

  @SubscribeMessage("join")
  join(
    @MessageBody() joinMatchDto: JoinMatchDto,
    @ConnectedSocket() client: Socket
  ): WsResponse<any> {
    return {
      event: "join",
      data: this.matchService.joinMatch(joinMatchDto, client),
    };
  }
}

interface MatchSubscribeAck {
  status: number;
  data: MatchInfo[];
}

interface MatchInfo {
  id: string;
  shopName: string;
  section: string;
  total: number;
  tip: number;
}
