import { EventEmitter } from "stream";
import { Room } from "../room";
import { User } from "../../../user/entity/user.entity";
import RoomUserView from "../../../room/dto/response/user-view.dto";
import KickVote from "../vote/KickVote";
import { v4 as uuidv4 } from "uuid";
import {
  ChatBody,
  Message,
  SystemBody,
} from "../../../room/dto/response/message.response";
import {
  KickVoteCreatedResponse,
  KickVoteFinishedResponse,
  ResetVoteCreatedResponse,
  ResetVoteFinishedResponse,
} from "../../../room/dto/response/vote.response";
import RoomUsers from "../users/users";
import RoomOrder from "../order/order";
import ResetVote from "../vote/ResetVote";
import {
  UserAllReadyResponse,
  UserJoinedResponse,
  UserLeaveResponse,
} from "../../../room/dto/response/users.response";
import {
  OrderCheckedResponse,
  OrderDoneResponse,
  OrderFixedResponse,
} from "../../../room/dto/response/order.response";

export default class RoomChat extends EventEmitter {
  private _room: Room;
  private _messages: Message<ChatBody | SystemBody>[] = [];

  private _readPointers: Map<User, number> = new Map();

  constructor(room: Room) {
    super();
    this._room = room;

    /**
     * User
     **/
    room.users.on("add", (user: User) => {
      const res = UserJoinedResponse.from(user);
      this._pushMessage(this._createSystemMessage(res));
    });
    room.users.on("delete", (user: User) => {
      const res = UserLeaveResponse.from(user);
      this._pushMessage(this._createSystemMessage(res));
    });
    room.users.on("all-ready", (roomUsers: RoomUsers) => {
      const res = UserAllReadyResponse.from(roomUsers);
      this._pushMessage(this._createSystemMessage(res));
    });

    /**
     * Vote
     **/
    //강퇴 투표가 시작됨
    room.vote.on("created-kick", (kickVote: KickVote) => {
      const body = KickVoteCreatedResponse.from(kickVote);
      this._pushMessage(this._createSystemMessage(body));
    });
    //리셋 투표가 시작됨
    room.vote.on("created-reset", (resetVote: ResetVote) => {
      const res = ResetVoteCreatedResponse.from(resetVote);
      this._pushMessage(this._createSystemMessage(res));
    });
    //강퇴 투표 결과가 나옴
    room.vote.on("kick-finish", (kickVote: KickVote) => {
      const res = KickVoteFinishedResponse.from(kickVote);
      this._pushMessage(this._createSystemMessage(res));
    });
    //리셋 투표 결과가 나옴
    room.vote.on("reset-finish", (resetVote: ResetVote) => {
      const res = ResetVoteFinishedResponse.from(resetVote);
      this._pushMessage(this._createSystemMessage(res));
    });

    /**
     * Order
     **/
    //모두 레디가 되어 방장이 order를 fix함
    room.order.on("fix", (roomOrder: RoomOrder) => {
      const res = OrderFixedResponse.from(roomOrder);
      this._pushMessage(this._createSystemMessage(res));
    });
    //방장이 결제 직전 정보를 업로드 함
    room.order.on("check", (roomOrder: RoomOrder) => {
      const res = OrderCheckedResponse.from(roomOrder);
      this._pushMessage(this._createSystemMessage(res));
    });
    //방장이 결제를 성사함(배달 시작)
    room.order.on("done", (roomOrder: RoomOrder) => {
      const res = OrderDoneResponse.from(roomOrder);
      this._pushMessage(this._createSystemMessage(res));
    });
  }

  setReadPointer(user: User) {
    this._readPointers.set(user, this._messages.length);
  }

  getMessagesFromLastPointer(user: User): Message<ChatBody | SystemBody>[] {
    //전송할 메시지 시작점
    const startPoint = this._readPointers.has(user)
      ? this._readPointers.get(user)
      : 0;
    //TODO 트랜잭션 처리?
    this.setReadPointer(user);
    return this._messages.slice(startPoint, this._messages.length);
  }

  receive(user: User, message: string) {
    const chatMessage: Message<ChatBody> = this._createChatMessage({
      ...RoomUserView.from(user),
      message: message,
    });

    this._pushMessage(chatMessage);
  }

  private _pushMessage(message: Message<ChatBody | SystemBody>) {
    this._messages.push(message);
    this.emit("receive", message);
  }

  private _createSystemMessage(body: SystemBody): Message<SystemBody> {
    return {
      at: String(Date.now()),
      id: uuidv4(),
      idx: this._messages.length,
      type: "system",
      body: body,
    };
  }
  private _createChatMessage(body: ChatBody): Message<ChatBody> {
    return {
      at: String(Date.now()),
      id: uuidv4(),
      idx: this._messages.length,
      type: "chat",
      body: body,
    };
  }
}