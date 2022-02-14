import { SystemBody } from "./message.response";

export class OrderFixedResponse implements SystemBody {
  readonly action = "order-fixed";
  data: {};
  static from() {
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
  static from() {
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
  static from() {
    return new OrderDoneResponse();
  }
}
