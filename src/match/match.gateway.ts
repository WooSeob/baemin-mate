import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Inject, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { MatchService } from "./match.service";
import { SubscribeCategoryDto } from "./dto/request/subscribe-category.dto";
import { IUserContainer } from "src/core/container/IUserContainer";
import { AuthService } from "src/auth/auth.service";
import { MatchSender } from "./match.sender";
import MatchInfo from "./dto/response/match-info.interface";
import Ack from "src/core/interfaces/ack.interface";
import { Match } from "../domain/match/match";

const metadata = {
  namespace: "/match",
  cors: { origin: "*" },
  allowEIO3: true,
};
@WebSocketGateway(metadata)
export class MatchGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private matchService: MatchService,
    @Inject("IUserContainer") private userContainer: IUserContainer,
    private authService: AuthService,
    private matchSender: MatchSender
  ) {}

  @WebSocketServer() public server: Server;
  private logger: Logger = new Logger("MatchGateway");

  afterInit(server: Server) {
    this.matchService.server = server;
    this.matchSender.server = server;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(client.handshake.auth); // prints { token: "abcd" }
    // console.log("MatchGateway-connection!!", client.id);
  }

  @SubscribeMessage("subscribe")
  subscribe(
    @MessageBody() subscribeCategoryDto: SubscribeCategoryDto,
    @ConnectedSocket() client: Socket
  ): Ack<MatchInfo[]> {
    if (
      !this.authService.verifySession(
        subscribeCategoryDto.userId,
        client.handshake.auth.token
      )
    ) {
      return {
        status: 401,
        data: [],
      };
    }

    let matches: Match[] = this.matchService.subscribeByCategory(
      subscribeCategoryDto,
      client
    );
    return {
      status: 200,
      data: matches.map((match): MatchInfo => {
        return {
          id: match.id,
          shopName: match.info.shopName,
          section: match.info.section,
          total: match.totalPrice,
          priceAtLeast: match.atLeast,
          purchaserName: match.info.purchaser.name,
          createdAt: match.info.createdAt,
        };
      }),
    };
  }
}
