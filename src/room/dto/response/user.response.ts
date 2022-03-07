import { ApiProperty } from "@nestjs/swagger";
import { UserEntity } from "../../../user/entity/user.entity";

export default class RoomUser {
  @ApiProperty({ description: "유저 id" })
  id: string;

  @ApiProperty({ description: "유저 이름" })
  name: string;

  static from(user: UserEntity): RoomUser {
    const userView = new RoomUser();
    userView.id = user.id;
    userView.name = user.name;
    return userView;
  }
}
