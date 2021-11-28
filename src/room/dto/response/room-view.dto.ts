import { Room } from "src/domain/room/room";
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

  static from(room: Room): RoomView {
    const roomView = new RoomView();
    roomView.matchId = room.id;
    roomView.shopName = room.info.shopName;
    roomView.purchaser = UserView.from(room.info.purchaser);
    roomView.tip = room.price.tip;
    roomView.totalPrice = room.price.total;
    roomView.users = room.users.getUserList().map((user) => {
      return {
        user: UserView.from(user),
        menus: room.menus.getMenusByUser(user),
      };
    });
    return roomView;
  }
}
