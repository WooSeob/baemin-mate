import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
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

@WebSocketGateway({ namespace: "/room", cors: { origin: "*" } })
export class RoomGateway implements OnGatewayInit, OnGatewayConnection {
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
    const user = await this.authService.validate(client.handshake.auth.token);
    if (user.isAlreadyJoined()) {
      client.join(user.joinRoom.id);
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
      return {
        status: 401,
        data: {},
      };
    }
    user.joinRoom.chat.receive(user, message);
    return {
      status: 200,
      data: {},
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
