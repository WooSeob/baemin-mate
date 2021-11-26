import UserView from "./user-view.dto";

export default class RoomView {
  matchId: string;
  shopName: string;
  purchaser: UserView;
  tip: number;
  totalPrice: number;
  users: UserView[];
}
