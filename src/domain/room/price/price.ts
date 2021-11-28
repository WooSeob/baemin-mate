import { TipBoundary } from "../../../match/interfaces/shop.interface";
import { Room } from "../room";
import { EventEmitter } from "stream";

export interface RoomPriceInfo {
  tip: number;
  total: number;
  deliveryTipsInterval: TipBoundary[];
}
export default class RoomPrice extends EventEmitter implements RoomPriceInfo {
  private _tip: number;
  private _total: number;
  readonly deliveryTipsInterval: TipBoundary[];

  private room: Room;
  constructor(room: Room, info: RoomPriceInfo) {
    super();
    this.room = room;

    this._tip = info.tip;
    this._total = info.total;
    this.deliveryTipsInterval = info.deliveryTipsInterval;
  }

  updatePrice(amount: number) {
    this._total += amount;
    this.deliveryTipsInterval.forEach((interval) => {
      if (this._total >= interval.price) {
        this._tip = interval.tip;
      }
    });
    this.emit("update", this);
  }

  get total(): number {
    return this._total;
  }

  get tip(): number {
    return this._tip;
  }
}
