import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { AuthService } from "src/auth/auth.service";
import { RoomService } from "./room.service";
import { Server, Socket } from "socket.io";
import Ack from "src/core/interfaces/ack.interface";
import None from "src/core/interfaces/none.interface";
import { RoomSender } from "./room.sender";
import { Logger } from "@nestjs/common";
import ChatRequestDto from "./dto/request/chat-request.dto";
import { UserService } from "../user/user.service";

@WebSocketGateway({ namespace: "/room", cors: { origin: "*" } })
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private _socketIdToUserId: Map<string, string> = new Map();
  private logger = new Logger("RoomGateway");

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private roomSender: RoomSender,
    private userService: UserService
  ) {}

  afterInit(server: Server) {
    this.roomService.server = server;
    this.roomSender.server = server;
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(client.handshake.auth.token);
    const user = await this.authService.validate(client.handshake.auth.token);
    //인증 실패시 강제 disconnect
    if (!user) {
      client.disconnect();
      return;
    }

    // Socket id <-> user id 매핑 셋
    this._socketIdToUserId.set(client.id, user.id);

    //이미 참가중인 방이 있으면
    user.joinedRooms.forEach((room) => {
      //TODO client.join은 기존 메시지 전송 이후에 이뤄져야함. (메시지 유실 가능성)
      client.join(room.id);
    });
  }

  async handleDisconnect(client: Socket) {
    const user = await this.userService.findUserById(
      this._socketIdToUserId.get(client.id)
    );
    //기존 매핑 삭제
    this._socketIdToUserId.delete(client.id);
    //최종 포인터 기록
    user.joinedRooms.forEach((room) => {
      room.chat.setReadPointer(user);
    });
  }

  @SubscribeMessage("chat")
  async chat(
    @MessageBody() chatRequestDto: ChatRequestDto,
    @ConnectedSocket() client: Socket
  ): Promise<Ack<None>> {
    const user = await this.userService.findUserById(
      this._socketIdToUserId.get(client.id)
    );
    if (!user) {
      client.disconnect();
      return {
        status: 401,
        data: {},
      };
    }

    const room = this.roomService.findRoomById(chatRequestDto.roomId);
    if (!room) {
      return {
        status: 404,
        data: {},
      };
    }
    room.chat.receive(user, chatRequestDto.message);

    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("get-messages")
  async getNotReceivedMessages(@ConnectedSocket() client: Socket) {
    const user = await this.userService.findUserById(
      this._socketIdToUserId.get(client.id)
    );
    if (!user) {
      client.disconnect();
      return {
        status: 401,
        data: {},
      };
    }

    return user.joinedRooms.map((room) => {
      return {
        rid: room.id,
        messages: room.chat.getMessagesFromLastPointer(user),
      };
    });
  }
}
