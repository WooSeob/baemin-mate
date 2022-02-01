import RoomOrder from "../../../domain/room/order/order";
import { SystemBody } from "./message.response";

export class OrderFixedResponse implements SystemBody {
  readonly action = "order-fixed";
  data: {};
  static from(roomOrder: RoomOrder) {
    return new OrderFixedResponse();
  }
}

export class OrderCheckedResponse implements SystemBody {
  readonly action = "order-checked";
  data: {
    screenshot: BinaryData;
    deliveryTipTotal: number;
    tipForIndividual: number;
  };
  static from(roomOrder: RoomOrder) {
    const r = new OrderCheckedResponse();
    r.data = {
      screenshot: null,
      deliveryTipTotal: -1,
      tipForIndividual: -1,
    };
    return r;
  }
}

export class OrderDoneResponse implements SystemBody {
  readonly action = "order-finished";
  data: {};
  static from(roomOrder: RoomOrder) {
    return new OrderDoneResponse();
  }
}
