import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { AuthService } from "src/auth/auth.service";
import { RoomService } from "./room.service";
import { Server, Socket } from "socket.io";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";
import Ack from "src/core/interfaces/ack.interface";
import None from "src/core/interfaces/none.interface";
import RoomView from "./dto/response/room-view.dto";
import { DeleteMenuDto } from "./dto/request/delete-menu.dto";
import { CloseMatchDto } from "./dto/request/close-match.dto";
import { JoinRoomDto } from "./dto/request/join-room.dto";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { RoomSender } from "./room.sender";

@WebSocketGateway({ namespace: "/room", cors: { origin: "*" } })
export class RoomGateway implements OnGatewayInit {
  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private roomSender: RoomSender
  ) {}
  afterInit(server: Server) {
    this.roomService.server = server;
    this.roomSender.server = server;
  }

  @SubscribeMessage("create")
  create(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket
  ): Ack<RoomView> {
    if (
      !this.authService.verifySession(
        createRoomDto.userId,
        client.handshake.auth.token
      )
    ) {
      return {
        status: 401,
        data: null,
      };
    }

    const created = this.roomService.createRoom(createRoomDto);
    client.join(created.id);

    this.roomSender.register(created);

    return {
      status: 200,
      data: RoomView.from(created),
    };
  }

  @SubscribeMessage("join")
  join(
    @MessageBody() joinRoomDto: JoinRoomDto,
    @ConnectedSocket() client: Socket
  ): Ack<RoomView> {
    const targetRoom = this.roomService.joinRoom(joinRoomDto);

    client.join(targetRoom.id);

    return {
      status: 200,
      data: RoomView.from(targetRoom),
    };
  }

  @SubscribeMessage("add-menus")
  addMenu(@MessageBody() addMenuDto: AddMenuDto): Ack<None> {
    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("update-menus")
  updateMenu(@MessageBody() updateMenuDto: UpdateMenuDto): Ack<None> {
    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("delete-menus")
  deleteMenu(@MessageBody() deleteMenuDto: DeleteMenuDto): Ack<None> {
    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("exit")
  exit(@MessageBody() exitMessage): Ack<None> {
    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("close-match")
  closeMatch(@MessageBody() closeMatchDto: CloseMatchDto): Ack<None> {
    return {
      status: 200,
      data: {},
    };
  }
}
