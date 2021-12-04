import { TipBoundary } from "../../../match/interfaces/shop.interface";
import { Room } from "../room";
import { EventEmitter } from "stream";

export interface RoomPriceInfo {
  total: number;
  atLeast: number;
}
export default class RoomPrice extends EventEmitter implements RoomPriceInfo {
  private _tip: number;
  private _total: number;
  private _atLeast: number;

  private room: Room;
  constructor(room: Room, info: RoomPriceInfo) {
    super();
    this.room = room;

    this._tip = 0;
    this._total = info.total;
    this._atLeast = info.atLeast;
  }

  updatePrice(amount: number) {
    this._total += amount;
    this.emit("update", this);
  }

  get total(): number {
    return this._total;
  }

  get tip(): number {
    return this._tip;
  }

  get atLeast(): number {
    return this._atLeast;
  }
}
