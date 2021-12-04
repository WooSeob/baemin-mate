import { EventEmitter } from "stream";
import { Room } from "../room";
import { RoomState } from "../context/context";
import { User } from "../../../user/entity/user.entity";

interface Chat {
  user: User;
  message: string;
  at: number;
}
export default class RoomChat extends EventEmitter {
  private _room: Room;
  private _chats: Chat[] = [];
  constructor(room: Room) {
    super();
    this._room = room;
  }
  receive(user: User, message: string) {
    const newMessage: Chat = {
      user: user,
      message: message,
      at: Date.now(),
    };
    this._chats.push(newMessage);
    this.emit("receive", newMessage);
  }
}
