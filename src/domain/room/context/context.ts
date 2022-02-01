export enum RoomState {
  prepare,
  orderFix,
  orderCheck,
  orderDone,
}

export default class RoomContext {
  private _state: RoomState = RoomState.prepare;

  get state(): RoomState {
    return this._state;
  }

  toOrderFix() {
    this._state = RoomState.orderFix;
  }
  toOrderCheck() {
    this._state = RoomState.orderCheck;
  }
  toOrderDone() {
    this._state = RoomState.orderDone;
  }
}
