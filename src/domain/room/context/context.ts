export enum RoomState {
  prepare,
  orderFix,
  orderCheck,
  orderDone,
}

export default class RoomContext {
  state: RoomState = RoomState.prepare;
}
