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
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { MatchService } from "./match.service";
import { AuthService } from "src/auth/auth.service";
import MatchInfo from "./dto/response/match-info.interface";
import { UserService } from "../user/user.service";
import { User } from "src/user/entity/user.entity";
import { Match } from "../entities/Match";

const metadata = {
  namespace: "/match",
  cors: { origin: "*" },
  allowEIO3: true,
};
@WebSocketGateway(metadata)
export class MatchGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private _socketIdToUserId: Map<string, Promise<string>> = new Map();
  constructor(
    private matchService: MatchService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  @WebSocketServer() public server: Server;
  private logger: Logger = new Logger("MatchGateway");

  afterInit(server: Server) {
    this.matchService.server = server;
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(
      `Client connected: ${client.id} (${client.handshake.auth.token})`
    );

    const foundUserPromise: Promise<User> = this.authService.validate(
      client.handshake.auth.token
    );

    // Socket id <-> user id 매핑 셋
    this._socketIdToUserId.set(
      client.id,
      new Promise((res, rej) => {
        foundUserPromise.then((u) => res(u.id)).catch((e) => rej(e));
      })
    );

    foundUserPromise.then((user) => {
      //인증 실패시 강제 disconnect
      if (!user) {
        console.log("auth fail at Match gateway");
        console.log(client.handshake.auth);
        client.disconnect();
        return;
      }
    });

    console.log(this._socketIdToUserId);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected: ${client.id} (${client.handshake.auth.token})`
    );

    //기존 매핑 삭제
    this._socketIdToUserId.delete(client.id);
  }

  @SubscribeMessage("subscribe")
  async subscribe(
    @MessageBody() _subscribeMatchDto: any,
    @ConnectedSocket() client: Socket
  ) {
    let subscribeMatchDto;
    if (typeof _subscribeMatchDto === "string") {
      subscribeMatchDto = JSON.parse(_subscribeMatchDto);
    } else {
      subscribeMatchDto = _subscribeMatchDto;
    }

    console.log(typeof subscribeMatchDto);

    console.log(subscribeMatchDto);
    const user = await this.userService.findUserById(
      await this._socketIdToUserId.get(client.id)
    );
    console.log(await this._socketIdToUserId.get(client.id));
    console.log(this._socketIdToUserId);

    if (!user) {
      console.log("user not found at subscribe");
      client.disconnect();
      return {
        status: 401,
        data: {},
      };
    }

    let matches: Match[] = await this.matchService.subscribeByCategory(
      subscribeMatchDto,
      client
    );
    console.log(matches);
    return {
      status: 200,
      data: matches.map((match): MatchInfo => {
        return MatchInfo.from(match);
      }),
    };
  }
}
