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

@WebSocketGateway({ namespace: "/room", cors: { origin: "*" } })
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger("RoomGateway");
  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private roomSender: RoomSender
  ) {}
  afterInit(server: Server) {
    this.roomService.server = server;
    this.roomSender.server = server;
  }
  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(client.handshake.auth.token);
    const user = await this.authService.validate(client.handshake.auth.token);
    //인증 실패시 disconnect
    if (!user) {
      client.disconnect();
      return;
    }
    //이미 참가중인 방이 있으면
    if (user.isAlreadyJoined()) {
      //소켓 룸 연결
      client.join(user.joinRoom.id);
      //기존 메시지 리스토어
      client.emit("", user.joinRoom.chat.getMessagesFromPointer(user));
    }
  }

  async handleDisconnect(client: Socket) {
    const user = await this.authService.validate(client.handshake.auth.token);
    if (user.isAlreadyJoined()) {
      user.joinRoom.chat.setReadPointer(user);
    }
  }

  // @SubscribeMessage("create")
  // async create(
  //   @MessageBody() createRoomDto: CreateRoomDto,
  //   @ConnectedSocket() client: Socket
  // ): Promise<Ack<RoomView>> {
  //   const user = await this.authService.validate(client.handshake.auth.token);
  //   if (!user) {
  //     return {
  //       status: 401,
  //       data: null,
  //     };
  //   }
  //
  //   console.log(user);
  //   const created = this.roomService.createRoom(user, createRoomDto);
  //   client.join(created.id);
  //
  //   console.log(created);
  //   this.roomSender.register(created);
  //
  //   return {
  //     status: 200,
  //     data: RoomView.from(created),
  //   };
  // }

  // @SubscribeMessage("join")
  // join(
  //   @MessageBody() joinRoomDto: JoinRoomDto,
  //   @ConnectedSocket() client: Socket
  // ): Ack<RoomView> {
  //   const targetRoom = this.roomService.joinRoom(joinRoomDto);
  //
  //   client.join(targetRoom.id);
  //
  //   return {
  //     status: 200,
  //     data: RoomView.from(targetRoom),
  //   };
  // }

  // @SubscribeMessage("exit")
  // exit(@MessageBody() exitMessage): Ack<None> {
  //   return {
  //     status: 200,
  //     data: {},
  //   };
  // }

  @SubscribeMessage("chat")
  async chat(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket
  ): Promise<Ack<None>> {
    const user = await this.authService.validate(client.handshake.auth.token);
    if (!user) {
      client.disconnect();
    }
    user.joinRoom.chat.receive(user, message);
    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("get-messages")
  async getNotReceivedMessages(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.validate(client.handshake.auth.token);
    if (!user) {
      return {
        status: 401,
        data: {},
      };
    }
    return {
      rid: user.joinRoom.id,
      messages: user.joinRoom.chat.getMessagesFromPointer(user),
    };
  }

  // @SubscribeMessage("close-match")
  // closeMatch(@MessageBody() closeMatchDto: CloseMatchDto): Ack<None> {
  //   return {
  //     status: 200,
  //     data: {},
  //   };
  // }
}
