import { Match } from "src/match/domain/match";
import { MenuItem } from "src/match/interfaces/shop.interface";
import UserView from "./user-view.dto";

export default class RoomView {
  matchId: string;
  shopName: string;
  purchaser: UserView;
  tip: number;
  totalPrice: number;
  users: {
    user: UserView;
    menus: MenuItem[];
  }[];

  static from(match: Match): RoomView {
    const roomView = new RoomView();
    roomView.matchId = match.id;
    roomView.shopName = match.shopName;
    roomView.purchaser = UserView.from(match.perchaser);
    roomView.tip = match.deliveryTip;
    roomView.totalPrice = match.totalPrice;
    roomView.users = Array.from(match.sellectedMenus).map(([user, menuitems]) => {
      return {
        user: UserView.from(user),
        menus: menuitems,
      };
    });
    return roomView;
  }
}
