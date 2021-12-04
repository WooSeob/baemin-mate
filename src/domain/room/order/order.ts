import { EventEmitter } from "stream";
import { Room } from "../room";
import { RoomState } from "../context/context";

export default class RoomOrder extends EventEmitter {
  private _room: Room;

  is;
  constructor(room: Room) {
    super();
    this._room = room;
  }

  fix() {
    this._room.ctx.state = RoomState.orderFix;
    this.emit("fix", this);
  }

  check() {
    this._room.ctx.state = RoomState.orderCheck;
    this.emit("check", this);
  }

  done() {
    this._room.ctx.state = RoomState.orderDone;
    this.emit("done", this);
  }
}
