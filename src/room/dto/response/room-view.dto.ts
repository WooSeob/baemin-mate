import { Room } from "src/domain/room/room";
import { MenuItem } from "src/match/interfaces/shop.interface";
import RoomUserView from "./user-view.dto";

export default class RoomView {
  matchId: string;
  shopName: string;
  purchaser: RoomUserView;
  tip: number;
  totalPrice: number;
  users: {
    user: RoomUserView;
    menus: MenuItem[];
  }[];

  static from(room: Room): RoomView {
    const roomView = new RoomView();
    roomView.matchId = room.id;
    roomView.shopName = room.info.shopName;
    roomView.purchaser = RoomUserView.from(room.info.purchaser);
    roomView.tip = room.price.tip;
    roomView.totalPrice = room.price.total;
    roomView.users = room.users.getUserList().map((user) => {
      return {
        user: RoomUserView.from(user),
        menus: room.menus.getMenusByUser(user),
      };
    });
    return roomView;
  }
}
