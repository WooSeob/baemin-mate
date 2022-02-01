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
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
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
    this.logger.log(`Client connected: ${client.id} (${client.handshake.auth.token})`);

    const user = await this.authService.validate(client.handshake.auth.token);
    //인증 실패시 강제 disconnect
    if (!user) {
      client.disconnect();
      return;
    }

    // Socket id <-> user id 매핑 셋
    this._socketIdToUserId.set(client.id, user.id);

    //유저 객체에 소켓 클라이언트 첨부
    Reflect.set(user, "socket", client);

    //이미 참가중인 방에 대해서 socket join 처리
    user.joinedRooms.forEach((room) => {
      client.join(room.id);
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id} (${client.handshake.auth.token})`);

    const user = await this.userService.findUserById(this._socketIdToUserId.get(client.id));
    //기존 매핑 삭제
    this._socketIdToUserId.delete(client.id);
    if (!user) {
      return;
    }
    //최종 포인터 기록
    user.joinedRooms.forEach((room) => {
      room.chat.setReadPointer(user);
    });
  }

  @SubscribeMessage("chat")
  async chat(
    @MessageBody() _chatRequestDto: any,
    @ConnectedSocket() client: Socket
  ): Promise<Ack<None>> {
    let chatRequestDto;
    if (typeof _chatRequestDto === "string") {
      chatRequestDto = JSON.parse(_chatRequestDto);
    } else {
      chatRequestDto = _chatRequestDto;
    }

    console.log(chatRequestDto);
    const user = await this.userService.findUserById(this._socketIdToUserId.get(client.id));
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
    const user = await this.userService.findUserById(this._socketIdToUserId.get(client.id));
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

  /**
   * Event "get-messages"를 통해 받지 못했던 메시지들을 받고
   * 클라이언트가 처리 완료하기 전에 room join을 해서 브로드 캐스트를 받을 경우
   * 메시지 순서가 섞일 수 있으니 아래 "ack-messages" 이후 join 하도록 함.
   * */
  @SubscribeMessage("ack-messages")
  async notReceivedMessagesAccepted(@ConnectedSocket() client: Socket) {
    const user = await this.userService.findUserById(this._socketIdToUserId.get(client.id));
    if (!user) {
      client.disconnect();
      return {
        status: 401,
        data: {},
      };
    }

    //이미 참가중인 방에 대해서 socket join 처리
    user.joinedRooms.forEach((room) => {
      client.join(room.id);
      room.chat.notReceivedMessagesAccepted();
    });
    return {};
  }
}
