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
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { MatchService } from "./match.service";
import { CreateMatchDto } from "./dto/create-match.dto";

@WebSocketGateway({ namespace: "/match" })
export class MatchGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private matchService: MatchService) {}

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
}
