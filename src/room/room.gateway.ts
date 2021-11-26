import {
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { AuthService } from "src/auth/auth.service";
import { RoomService } from "./room.service";
import { Server } from "socket.io";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";
import Ack from "src/core/interfaces/ack.interface";
import None from "src/core/interfaces/none.interface";
import RoomView from "./dto/response/room-view.dto";
import { InitDto } from "./dto/request/init.dto";
import { DeleteMenuDto } from "./dto/request/delete-menu.dto";
import { CloseMatchDto } from "./dto/request/close-match.dto";

@WebSocketGateway({ namespace: "/room", cors: { origin: "*" } })
export class RoomGateway implements OnGatewayInit {
  constructor(private roomService: RoomService, private authService: AuthService) {}
  afterInit(server: Server) {
    this.roomService.server = server;
  }
  @SubscribeMessage("init")
  init(@MessageBody() initDto: InitDto): Ack<RoomView> {
    // 방 최초 입장시 기존 Room State 전달
    const match = this.roomService.getRoomData(initDto);

    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("add-menu")
  addMenu(@MessageBody() addMenuDto: AddMenuDto): Ack<None> {
    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("update-menu")
  updateMenu(@MessageBody() updateMenuDto: UpdateMenuDto): Ack<None> {
    return {
      status: 200,
      data: {},
    };
  }

  @SubscribeMessage("delte-menu")
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
