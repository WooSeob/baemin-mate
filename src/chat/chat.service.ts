import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { RoomService } from "../room/room.service";
import { RoomEventType } from "../room/const/RoomEventType";
import { Repository } from "typeorm";

import {
  ChatBody,
  Message,
  SystemBody,
} from "../room/dto/response/message.response";
import {
  UserAllReadyCanceledResponse,
  UserAllReadyResponse,
  UserJoinedResponse,
  UserLeaveResponse,
} from "../room/dto/response/users.response";
import RoomChat, {
  ChatMessageBuilder,
  SystemMessageBuilder,
} from "../room/entity/RoomChat";
import { InjectRepository } from "@nestjs/typeorm";
import { UserService } from "../user/user.service";
import {
  OrderCheckedResponse,
  OrderDoneResponse,
  OrderFixedResponse,
} from "../room/dto/response/order.response";
import {
  KickVoteCreatedResponse,
  KickVoteFinishedResponse,
  ResetVoteCreatedResponse,
  ResetVoteFinishedResponse,
} from "../room/dto/response/vote.response";
import {
  ChatMessageResponse,
  SystemMessageResponse,
} from "../room/dto/response/chat.response";
import RoomUserView from "../room/dto/response/user-view.dto";
import { RoomGateway } from "../room/room.gateway";

@Injectable()
export class ChatService {
  private _createUserEventData(
    type: RoomEventType,
    roomId: string,
    userId: string
  ) {
    const messagePromise = this.chatRepository.save(
      new SystemMessageBuilder()
        .setRoom(roomId)
        .setType(type)
        .setMetadataId(userId)
        .build()
    );
    const userPromise = this.userService.findUserOrUnknownIfNotExist(userId);
    return Promise.all([messagePromise, userPromise]);
  }

  constructor(
    private roomService: RoomService,
    private userService: UserService,
    @InjectRepository(RoomChat) private chatRepository: Repository<RoomChat>
  ) {
    // 일반 채팅
    roomService.on(RoomEventType.CHAT, (room) => {});

    // 입/퇴장 관련
    roomService.on(RoomEventType.USER_ENTER, async (roomId, userId) => {
      const [roomChat, user] = await this._createUserEventData(
        RoomEventType.USER_ENTER,
        roomId,
        userId
      );
      this.broadcastChat(
        roomId,
        SystemMessageResponse.from(roomChat, UserJoinedResponse.from(user))
      );
    });

    roomService.on(RoomEventType.USER_LEAVE, async (roomId, userId) => {
      const [roomChat, user] = await this._createUserEventData(
        RoomEventType.USER_LEAVE,
        roomId,
        userId
      );
      this.broadcastChat(
        roomId,
        SystemMessageResponse.from(roomChat, UserLeaveResponse.from(user))
      );
    });

    roomService.on(RoomEventType.USER_KICKED, async (roomId, userId) => {
      //TODO Api에 kicked 추가
      // const [roomChat, user] = await this._createUserEventData(
      //   RoomEventType.USER_KICKED,
      //   roomId,
      //   userId
      // );
      // this.broadcastChat(
      //   roomId,
      //   SystemMessageResponse.from(roomChat, User.from(user))
      // );
    });

    // 레디 상태
    roomService.on(RoomEventType.ALL_READY, async (roomId) => {
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(roomId)
          .setType(RoomEventType.ALL_READY)
          .setMetadataId("empty")
          .build()
      );
      this.broadcastChat(
        roomId,
        SystemMessageResponse.from(roomChat, UserAllReadyResponse.from())
      );
    });

    roomService.on(RoomEventType.ALL_READY_CANCELED, async (roomId) => {
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(roomId)
          .setType(RoomEventType.ALL_READY_CANCELED)
          .setMetadataId("empty")
          .build()
      );
      this.broadcastChat(
        roomId,
        SystemMessageResponse.from(
          roomChat,
          UserAllReadyCanceledResponse.from()
        )
      );
    });

    // 진행 상태
    roomService.on(RoomEventType.ORDER_FIXED, async (roomId) => {
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(roomId)
          .setType(RoomEventType.ORDER_FIXED)
          .setMetadataId("empty")
          .build()
      );
      this.broadcastChat(
        roomId,
        SystemMessageResponse.from(roomChat, OrderFixedResponse.from())
      );
    });

    roomService.on(RoomEventType.ORDER_CHECKED, async (roomId) => {
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(roomId)
          .setType(RoomEventType.ORDER_CHECKED)
          .setMetadataId("empty")
          .build()
      );
      this.broadcastChat(
        roomId,
        SystemMessageResponse.from(roomChat, OrderCheckedResponse.from())
      );
    });

    roomService.on(RoomEventType.ORDER_DONE, async (roomId) => {
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(roomId)
          .setType(RoomEventType.ORDER_DONE)
          .setMetadataId("empty")
          .build()
      );
      this.broadcastChat(
        roomId,
        SystemMessageResponse.from(roomChat, OrderDoneResponse.from())
      );
    });

    // 투표 관련
    roomService.on(RoomEventType.KICK_VOTE_CREATED, async (vote) => {
      //TODO vote에 targetUser 없을수도있음
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(vote.roomId)
          .setType(RoomEventType.KICK_VOTE_CREATED)
          .setMetadataId(vote.id)
          .build()
      );
      this.broadcastChat(
        vote.roomId,
        SystemMessageResponse.from(roomChat, KickVoteCreatedResponse.from(vote))
      );
    });

    roomService.on(RoomEventType.KICK_VOTE_FINISHED, async (vote) => {
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(vote.roomId)
          .setType(RoomEventType.KICK_VOTE_FINISHED)
          .setMetadataId(vote.id)
          .build()
      );
      this.broadcastChat(
        vote.roomId,
        SystemMessageResponse.from(
          roomChat,
          KickVoteFinishedResponse.from(vote)
        )
      );
    });

    roomService.on(RoomEventType.RESET_VOTE_CREATED, async (vote) => {
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(vote.roomId)
          .setType(RoomEventType.RESET_VOTE_CREATED)
          .setMetadataId(vote.id)
          .build()
      );
      this.broadcastChat(
        vote.roomId,
        SystemMessageResponse.from(
          roomChat,
          ResetVoteCreatedResponse.from(vote)
        )
      );
    });

    roomService.on(RoomEventType.RESET_VOTE_FINISHED, async (vote) => {
      const roomChat = await this.chatRepository.save(
        new SystemMessageBuilder()
          .setRoom(vote.roomId)
          .setType(RoomEventType.RESET_VOTE_FINISHED)
          .setMetadataId(vote.id)
          .build()
      );
      this.broadcastChat(
        vote.roomId,
        SystemMessageResponse.from(
          roomChat,
          ResetVoteFinishedResponse.from(vote)
        )
      );
    });
  }

  async clear() {
    await this.chatRepository.clear();
  }

  getAllMessagesByRoom(roomId: string) {
    return this.chatRepository.find({ roomId: roomId });
  }

  async getAllMessagesResponse(roomId: string) {
    const roomChats = await this.getAllMessagesByRoom(roomId);

    const messagesPromise = roomChats.map(async (roomChat) => {
      let user, vote;
      switch (roomChat.type) {
        case RoomEventType.USER_ENTER:
          user = await this.userService.findUserOrUnknownIfNotExist(
            roomChat.eventMetadataId
          );
          return SystemMessageResponse.from(
            roomChat,
            UserJoinedResponse.from(user)
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.USER_KICKED:
        //TODO
        case RoomEventType.USER_LEAVE:
          user = await this.userService.findUserOrUnknownIfNotExist(
            roomChat.eventMetadataId
          );
          return SystemMessageResponse.from(
            roomChat,
            UserLeaveResponse.from(user)
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.ALL_READY:
          return SystemMessageResponse.from(
            roomChat,
            UserAllReadyResponse.from()
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.ALL_READY_CANCELED:
          return SystemMessageResponse.from(
            roomChat,
            UserAllReadyCanceledResponse.from()
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.ORDER_FIXED:
          return SystemMessageResponse.from(
            roomChat,
            OrderFixedResponse.from()
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.ORDER_CHECKED:
          return SystemMessageResponse.from(
            roomChat,
            OrderCheckedResponse.from()
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.ORDER_DONE:
          return SystemMessageResponse.from(
            roomChat,
            OrderDoneResponse.from()
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.KICK_VOTE_CREATED:
          vote = this.roomService.getVoteById(roomChat.eventMetadataId);
          return SystemMessageResponse.from(
            roomChat,
            KickVoteCreatedResponse.from(vote)
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.KICK_VOTE_FINISHED:
          vote = this.roomService.getVoteById(roomChat.eventMetadataId);
          return SystemMessageResponse.from(
            roomChat,
            KickVoteFinishedResponse.from(vote)
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.RESET_VOTE_CREATED:
          vote = this.roomService.getVoteById(roomChat.eventMetadataId);
          return SystemMessageResponse.from(
            roomChat,
            ResetVoteCreatedResponse.from(vote)
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.RESET_VOTE_FINISHED:
          vote = this.roomService.getVoteById(roomChat.eventMetadataId);
          return SystemMessageResponse.from(
            roomChat,
            ResetVoteFinishedResponse.from(vote)
          ) as Message<SystemBody | ChatBody>;

        case RoomEventType.CHAT:
          user = await this.userService.findUserOrUnknownIfNotExist(
            roomChat.userId
          );
          return ChatMessageResponse.from(roomChat, {
            ...RoomUserView.from(user),
            message: roomChat.message,
          }) as Message<SystemBody | ChatBody>;
      }
    });

    return await Promise.all(messagesPromise);
  }

  async receiveChat(roomId: string, userId: string, message: string) {
    const messagePromise = this.chatRepository.save(
      new ChatMessageBuilder()
        .setRoom(roomId)
        .setUser(userId)
        .setMessage(message)
        .build()
    );

    const userPromise = this.userService.findUserOrUnknownIfNotExist(userId);

    const [roomChat, user] = await Promise.all([messagePromise, userPromise]);

    this.broadcastChat(
      roomId,
      ChatMessageResponse.from(roomChat, {
        ...RoomUserView.from(user),
        message: message,
      })
    );
  }

  private async broadcastChat(
    roomId: string,
    message: Message<ChatBody | SystemBody>
  ) {
    console.log(roomId);
    console.log(message);
    RoomGateway.server.to(roomId).emit(RoomEventType.CHAT, {
      rid: roomId,
      messages: [message],
    });
  }
}
// interface ChatResponse {
//   rid: string;
//   messages: Message<ChatBody | SystemBody>[];
// }
