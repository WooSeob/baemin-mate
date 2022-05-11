import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { RoomService } from "./room.service";
import { Server, Socket } from "socket.io";
import {
  Injectable,
  Logger,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { RoomEventType } from "./const/RoomEventType";
import { ObjectPipe } from "../common/pipe/object.pipe";
import ChatRequestDto from "./dto/request/chat-request.dto";
import { LoggingInterceptor } from "../common/interceptors/logging.interceptor";
import { WsEvent } from "../common/decorators/ws-event.decorator";
import { AuthService } from "../auth/auth.service";
import Ack from "../common/interfaces/ack.interface";
import None from "../common/interfaces/none.interface";

@UsePipes(new ObjectPipe(), new ValidationPipe({ transform: true }))
@UseInterceptors(LoggingInterceptor)
@Injectable()
@WebSocketGateway({ namespace: "/room", cors: { origin: "*" } })
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private _socketIdToUserId: Map<string, string> = new Map();
  private _userIdToSocketId: Map<string, string[]> = new Map();

  private logger = new Logger("RoomGateway");

  private _server: Server;

  get server() {
    return this._server;
  }

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private userService: UserService
  ) {
    roomService.on(RoomEventType.USER_ENTER, (roomId, userId) => {
      const socketIds = this._userIdToSocketId.get(userId);
      socketIds.forEach(async (sid) => {
        const sockets = await this._server.in(sid).fetchSockets();
        sockets.forEach((socket) => {
          socket.join(roomId);
        });
      });
    });
  }

  afterInit(server: Server) {
    this._server = server;
    server.use(async (socket, next) => {
      let token = socket.handshake.auth.token;
      if (token.split(" ").length > 1) {
        token = token.split(" ")[1];
      }
      const user = await this.authService.validate(token);
      //인증 실패시 강제 disconnect
      if (!user) {
        this.logger.log({
          message: `[Authentication failed] #${socket.id} disconnect.`,
          token: socket.handshake.auth.token,
        });
        return next(new Error("Authentication failed"));
      }
      // Socket id <-> user id 매핑 셋
      // this._socketToUid.set(client, user.id);
      this.addToLookup(socket.id, user.id);
      next();
    });
  }

  private addToLookup(clientId: string, userId: string) {
    this._socketIdToUserId.set(clientId, userId);
    if (!this._userIdToSocketId.has(userId)) {
      this._userIdToSocketId.set(userId, []);
    }
    this._userIdToSocketId.get(userId).push(clientId);
  }

  private removeFromLookup(clientId: string, userId: string) {
    this._socketIdToUserId.delete(clientId);
    if (!this._userIdToSocketId.has(userId)) {
      const cIds = this._userIdToSocketId.get(userId);
      const idx = cIds.findIndex((cId) => cId == clientId);
      if (idx < 0) {
        return;
      }
      cIds.splice(idx, 1);
    }
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log({
      message: `[Client Connected] #${client.id}`,
      handshake: client.handshake,
    });

    const uid = this._socketIdToUserId.get(client.id);

    //이미 참가중인 방에 대해서 socket join 처리
    (await this.userService.getJoinedRoomIds(uid)).forEach((roomId) => {
      client.join(roomId);
    });
  }

  async handleDisconnect(client: Socket) {
    const uid = this._socketIdToUserId.get(client.id);
    this.logger.log({
      message: `[Client Disconnected] #${client.id} (${uid})`,
    });

    //기존 매핑 삭제
    this.removeFromLookup(client.id, uid);
  }

  broadcastChat(roomId: string, msg) {
    this.server.to(roomId).emit(RoomEventType.CHAT, msg);
  }

  @WsEvent("chat")
  @SubscribeMessage("chat")
  async chat(
    @MessageBody() chatRequestDto: ChatRequestDto,
    @ConnectedSocket() client: Socket
  ): Promise<Ack<None>> {
    const uid = this._socketIdToUserId.get(client.id);
    this.logger.log({
      message: `[Chat] #${client.id} (${uid})`,
      dto: chatRequestDto,
    });

    const user = await this.userService.findUserById(uid);
    if (!user) {
      this.logger.warn(
        `[Chat] User(${uid}) 를 찾을 수 없습니다. 연결을 해제합니다.`
      );
      client.disconnect();
      return {
        status: 401,
        data: {},
      };
    }

    const room = await this.roomService.findRoomById(chatRequestDto.roomId);
    if (!room) {
      this.logger.error(
        `[Chat] Room(${chatRequestDto.roomId}) 를 찾을 수 없습니다.`
      );
      return {
        status: 404,
        data: {},
      };
    }

    await this.roomService.receiveChat(
      room.id,
      user.id,
      chatRequestDto.message
    );

    return {
      status: 200,
      data: {},
    };
  }
}
