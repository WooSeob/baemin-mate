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
import Ack from "src/common/interfaces/ack.interface";
import None from "src/common/interfaces/none.interface";
import { Logger } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { ChatService } from "../chat/chat.service";
import { RoomEventType } from "./const/RoomEventType";

@WebSocketGateway({ namespace: "/room", cors: { origin: "*" } })
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private _socketIdToUserId: Map<string, string> = new Map();
  private _userIdToSocketId: Map<string, string[]> = new Map();

  private logger = new Logger("RoomGateway");

  private static _server: Server;

  static get server() {
    return RoomGateway._server;
  }

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private userService: UserService,
    private chatService: ChatService
  ) {
    roomService.on(RoomEventType.USER_ENTER, (roomId, userId) => {
      const socketIds = this._userIdToSocketId.get(userId);
      socketIds.forEach(async (sid) => {
        // console.log(RoomGateway._server.);

        const sockets = await RoomGateway._server.in(sid).fetchSockets();
        console.log(sockets);
        sockets.forEach((socket) => {
          socket.join(roomId);
        });
      });
    });
  }

  afterInit(server: Server) {
    RoomGateway._server = server;
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
    this.logger.log(
      `Client connected: ${client.id} (${client.handshake.auth.token})`
    );

    let token = client.handshake.auth.token;
    if (token.split(" ").length > 1) {
      token = token.split(" ")[1];
    }
    const user = await this.authService.validate(token);
    //인증 실패시 강제 disconnect
    if (!user) {
      client.disconnect();
      return;
    }

    // Socket id <-> user id 매핑 셋
    // this._socketToUid.set(client, user.id);
    this.addToLookup(client.id, user.id);

    //이미 참가중인 방에 대해서 socket join 처리
    (await this.userService.getJoinedRoomIds(user.id)).forEach((roomId) => {
      client.join(roomId);
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected: ${client.id} (${client.handshake.auth.token})`
    );

    const user = await this.userService.findUserById(
      this._socketIdToUserId.get(client.id)
    );

    //기존 매핑 삭제
    this.removeFromLookup(client.id, user.id);

    // if (!user) {
    //   return;
    // }
    //최종 포인터 기록
    //TODO 구현하기
    // user.joinedRooms.forEach((room) => {
    //   room.chat.setReadPointer(user);
    // });
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

    const room = await this.roomService.findRoomById(chatRequestDto.roomId);
    if (!room) {
      return {
        status: 404,
        data: {},
      };
    }

    await this.chatService.receiveChat(
      room.id,
      user.id,
      chatRequestDto.message
    );

    return {
      status: 200,
      data: {},
    };
  }

  // @SubscribeMessage("get-messages")
  // async getNotReceivedMessages(@ConnectedSocket() client: Socket) {
  //   const user = await this.userService.findUserById(
  //     this._socketIdToUserId.get(client.id)
  //   );
  //   if (!user) {
  //     client.disconnect();
  //     return {
  //       status: 401,
  //       data: {},
  //     };
  //   }
  //
  //   return (await this.userService.getJoinedRoomIds(user.id)).map(
  //     async (roomId) => await this.chatService.getAllMessagesResponse(roomId)
  //   );
  // }

  /**
   * Event "get-messages"를 통해 받지 못했던 메시지들을 받고
   * 클라이언트가 처리 완료하기 전에 room join을 해서 브로드 캐스트를 받을 경우
   * 메시지 순서가 섞일 수 있으니 아래 "ack-messages" 이후 join 하도록 함.
   * */
  // @SubscribeMessage("ack-messages")
  // async notReceivedMessagesAccepted(@ConnectedSocket() client: Socket) {
  //   const user = await this.userService.findUserById(
  //     this._socketIdToUserId.get(client.id)
  //   );
  //   if (!user) {
  //     client.disconnect();
  //     return {
  //       status: 401,
  //       data: {},
  //     };
  //   }
  //
  //   //이미 참가중인 방에 대해서 socket join 처리
  //   user.joinedRooms.forEach((room) => {
  //     client.join(room.id);
  //     room.chat.notReceivedMessagesAccepted();
  //   });
  //   return {};
  // }
}
