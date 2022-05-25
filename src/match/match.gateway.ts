import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  BaseWsExceptionFilter,
} from "@nestjs/websockets";
import {
  ArgumentMetadata,
  Inject,
  Injectable,
  Logger,
  PipeTransform,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { MatchService } from "./match.service";
import { AuthService, AccessTokenPayload } from "src/auth/auth.service";
import MatchInfo from "./dto/response/match-info.interface";
import { UserService } from "../user/user.service";
import { MatchEntity } from "./entity/match.entity";
import { SubscribeMatchDto } from "./dto/request/subscribe-match.dto";
import { ObjectPipe } from "../common/pipe/object.pipe";
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from "nest-winston";
import { LoggingInterceptor } from "../common/interceptors/logging.interceptor";
import { WsEvent } from "../common/decorators/ws-event.decorator";

const metadata = {
  namespace: "/match",
  cors: { origin: "*" },
  allowEIO3: true,
};
@UsePipes(new ObjectPipe(), new ValidationPipe({ transform: true }))
@UseInterceptors(LoggingInterceptor)
@WebSocketGateway(metadata)
export class MatchGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger("MatchGateway");
  private _socketIdToUserId: Map<string, Promise<string>> = new Map();
  constructor(
    private matchService: MatchService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  @WebSocketServer() public server: Server;

  afterInit(server: Server) {
    this.matchService.server = server;
    server.use((socket, next) => {
      let token = socket.handshake.auth.token;
      if (token.split(" ").length > 1) {
        token = token.split(" ")[1];
      }
      const foundUserPromise: Promise<AccessTokenPayload> =
        this.authService.validate(token);

      // Socket id <-> user id 매핑 셋
      this._socketIdToUserId.set(
        socket.id,
        new Promise((res, rej) => {
          foundUserPromise.then((u) => res(u.id)).catch((e) => rej(e));
        })
      );

      foundUserPromise.then((user) => {
        //인증 실패시 강제 disconnect
        if (!user) {
          this.logger.log({
            message: `[Authentication failed] #${socket.id} disconnect.`,
            token: socket.handshake.auth.token,
          });
          return next(new Error("Authentication failed"));
        }
        next();
      });
    });
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log({
      message: `[Client Connected] #${client.id}`,
      handshake: client.handshake,
    });
  }

  async handleDisconnect(client: Socket) {
    const uid = await this._socketIdToUserId.get(client.id);
    this.logger.log({
      message: `[Client Disconnected] #${client.id} (${uid})`,
    });

    //기존 매핑 삭제
    this._socketIdToUserId.delete(client.id);
  }

  @WsEvent("subscribe")
  @SubscribeMessage("subscribe")
  async subscribe(
    @MessageBody()
    subscribeDto: SubscribeMatchDto,
    @ConnectedSocket() client: Socket
  ) {
    const uid = await this._socketIdToUserId.get(client.id);
    this.logger.log({
      message: `[subscribe] #${client.id} (${uid})`,
      dto: subscribeDto,
    });

    const user = await this.userService.findUserById(uid);

    if (!user) {
      this.logger.warn(
        `[subscribe] User(${uid}) 를 찾을 수 없습니다. 연결을 해제합니다.`
      );
      client.disconnect();
      return {
        status: 401,
        data: {},
      };
    }

    let matches: MatchEntity[] = await this.matchService.subscribeByCategory(
      user,
      subscribeDto,
      client
    );

    return {
      status: 200,
      data: matches.map((match): MatchInfo => {
        return MatchInfo.from(match);
      }),
    };
  }
}
