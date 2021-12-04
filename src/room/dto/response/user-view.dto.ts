import { User } from "../../../user/entity/user.entity";

export default class RoomUserView {
  userId: string;
  name: string;
  mannerRate: number;

  static from(user: User): RoomUserView {
    const userView = new RoomUserView();
    userView.userId = user.id;
    userView.name = "not implemented";
    userView.mannerRate = user.mannerRate;
    return userView;
  }
}
