import { EventEmitter } from "stream";
import { Room } from "../room";
import { User } from "../../../user/entity/user.entity";

enum MessageType {
  System,
  Chat,
}
export interface Chat {
  user: User;
  message: string;
  at: number;
}
interface SystemMessage {}
type Message = Chat | SystemMessage;

export default class RoomChat extends EventEmitter {
  private _room: Room;
  private _messages: Message[] = [];
  private _readPointers: Map<User, number> = new Map();

  constructor(room: Room) {
    super();
    this._room = room;
    //강퇴 투표가 시작됨
    room.vote.on("created-kick", () => {});
    //리셋 투표가 시작됨
    room.vote.on("created-reset", () => {});
    //투표 결과가 나옴
    room.vote.on("finish", () => {});
  }
  receive(user: User, message: string) {
    const newMessage: Chat = {
      user: user,
      message: message,
      at: Date.now(),
    };
    this._messages.push(newMessage);
    this.emit("receive", newMessage);
  }
}
