import { MenuItem } from "src/match/interfaces/shop.interface";
import { User } from "src/user/interfaces/user";

export default class UserView {
  userId: string;
  nickname: string;
  mannerRate: number;

  static from(user: User): UserView {
    const userView = new UserView();
    userView.userId = user.getId();
    userView.nickname = "not implemented";
    userView.mannerRate = user.getMannerRate();
    return userView;
  }
}
