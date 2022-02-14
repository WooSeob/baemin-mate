export enum RoomState {
  PREPARE,
  ALL_READY,
  ORDER_FIX,
  ORDER_CHECK,
  ORDER_DONE,
}

export default class RoomContext {
  private _state: RoomState = RoomState.PREPARE;

  get state(): RoomState {
    return this._state;
  }

  toOrderFix() {
    this._state = RoomState.ORDER_FIX;
  }
  toOrderCheck() {
    this._state = RoomState.ORDER_CHECK;
  }
  toOrderDone() {
    this._state = RoomState.ORDER_DONE;
  }
}
