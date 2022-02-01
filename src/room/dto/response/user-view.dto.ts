import { User } from "../../../user/entity/user.entity";
import { ApiProperty } from "@nestjs/swagger";

export default class RoomUserView {
  @ApiProperty({ description: "유저 id" })
  userId: string;

  @ApiProperty({ description: "유저 이름" })
  name: string;

  static from(user: User): RoomUserView {
    const userView = new RoomUserView();
    userView.userId = user.id;
    userView.name = user.name;
    return userView;
  }
}
