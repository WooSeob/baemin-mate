import { EventEmitter } from "stream";
import { Room } from "../room";

export default class RoomOrder extends EventEmitter {
  private _room: Room;

  private _screenshotUploaded: boolean = false;

  constructor(room: Room) {
    super();
    this._room = room;
  }

  fix() {
    this._room.ctx.toOrderFix();
    this.emit("fix", this);
  }

  check() {
    this._room.ctx.toOrderCheck();
    this.emit("check", this);
  }

  done() {
    this._room.ctx.toOrderDone();
    this.emit("done", this);
  }

  upload() {
    this._screenshotUploaded = true;
  }

  get screenshotUploaded() {
    return this._screenshotUploaded;
  }
}
