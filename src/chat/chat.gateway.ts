import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { RoomService } from "../room/room.service";
import { Server, Socket } from "socket.io";
import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { RoomEventType } from "../room/const/RoomEventType";
import { ObjectPipe } from "../common/pipe/object.pipe";
import ChatRequestDto from "./dto/request/chat-request.dto";
import { LoggingInterceptor } from "../common/interceptors/logging.interceptor";
import { WsEvent } from "../common/decorators/ws-event.decorator";
import { AuthService } from "../auth/auth.service";
import Ack from "../common/interfaces/ack.interface";
import None from "../common/interfaces/none.interface";
import { RoomRole } from "../room/entity/room.entity";
import { ChatService } from "./chat.service";
import ChatReadDto from "./dto/request/chat-read.dto";
import ChatReadIdDto, {
  ChatReadsIdDto,
} from "./dto/response/chat-read-ids.dto";
import { MatchService } from "../match/match.service";
import { ChatEventType } from "./const/ChatEventType";
import { ParticipantEntity } from "../room/entity/participant.entity";
import ParticipantStateResponse from "../room/dto/response/participant-state.response";

@UsePipes(new ObjectPipe(), new ValidationPipe({ transform: true }))
@UseInterceptors(LoggingInterceptor)
@Injectable()
@WebSocketGateway({ namespace: "/room", cors: { origin: "*" } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private _socketIdToUserId: Map<string, string> = new Map();
  private _userIdToSocketId: Map<string, string[]> = new Map();

  private logger = new Logger("ChatGateway");

  server: Server;

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private userService: UserService,
    private chatService: ChatService
  ) {
    roomService.on(RoomEventType.USER_ENTER, (roomId, userId) => {
      const socketIds = this._userIdToSocketId.get(userId);
      socketIds.forEach(async (sid) => {
        const sockets = await this.server.in(sid).fetchSockets();
        sockets.forEach((socket) => {
          socket.join(roomId);
        });
      });
    });

    roomService.on(RoomEventType.USER_KICKED_BY_VOTE, (roomId, userId) => {
      this.socketRoomLeave(roomId, userId);
    });

    roomService.on(RoomEventType.USER_KICKED, (roomId, userId) => {
      this.socketRoomLeave(roomId, userId);
    });

    chatService.on(
      ChatEventType.BROAD_CAST_RECEIVED,
      (roomId: string, message) => {
        this.broadcastChat(roomId, message);
      }
    );

    chatService.on(ChatEventType.READ_IDS_UPDATED, async (roomId: string) => {
      const readIds = await this.chatService.getReadMessageIds(roomId);
      this.broadcastLatestChatReadIds(roomId, readIds);
    });

    roomService.on(
      RoomEventType.PARTICIPANT_STATE_CHANGED,
      async (roomId: string, participant: ParticipantEntity) => {
        this.broadcastChangedParticipantState(roomId, participant);
      }
    );
  }

  private socketRoomLeave(roomId, userId) {
    const socketIds = this._userIdToSocketId.get(userId);
    socketIds.forEach(async (sid) => {
      const sockets = await this.server.in(sid).fetchSockets();
      sockets.forEach((socket) => {
        socket.leave(roomId);
      });
    });
  }

  afterInit(server: Server) {
    this.server = server;
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
    (await this.userService.getParticipations(uid))
      .filter((p) => p.role == RoomRole.MEMBER || p.role == RoomRole.PURCHASER)
      .forEach((p) => {
        client.join(p.roomId);
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

  broadcastLatestChatReadIds(roomId: string, readIds: ChatReadIdDto[]) {
    const response: ChatReadsIdDto = new ChatReadsIdDto();
    response.roomId = roomId;
    response.messageIds = readIds;
    this.server.to(roomId).emit(RoomEventType.CHAT_READ_ID_UPDATED, response);
  }

  broadcastChangedParticipantState(
    roomId: string,
    participant: ParticipantEntity
  ) {
    this.server
      .to(roomId)
      .emit(
        RoomEventType.PARTICIPANT_STATE_CHANGED,
        ParticipantStateResponse.from(participant)
      );
  }

  @WsEvent("read")
  @SubscribeMessage("read")
  async read(
    @MessageBody() chatReadDto: ChatReadDto,
    @ConnectedSocket() client: Socket
  ) {
    const uid = this._socketIdToUserId.get(client.id);
    return this.chatService.updateReadMessageId(
      chatReadDto.roomId,
      uid,
      chatReadDto.messageId
    );
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

    await this.chatService.onChatEvent(
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
