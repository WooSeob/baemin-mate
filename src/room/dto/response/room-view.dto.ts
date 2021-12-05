import { Room } from "src/domain/room/room";
import RoomUserView from "./user-view.dto";
import { ApiProperty } from "@nestjs/swagger";

export default class RoomView {
  @ApiProperty({ description: "room id" })
  id: string;

  @ApiProperty({ description: "가게 이름" })
  shopName: string;

  @ApiProperty({ description: "방장 정보" })
  purchaser: RoomUserView;

  @ApiProperty({ description: "방 state" })
  state: number;

  @ApiProperty({ description: "해당 방 주문 합계금액" })
  totalPrice: number;

  @ApiProperty({ description: "참여 유저 정보 목록" })
  users: RoomUserView[];

  static from(room: Room): RoomView {
    const roomView = new RoomView();
    roomView.id = room.id;
    roomView.shopName = room.info.shopName;
    roomView.purchaser = RoomUserView.from(room.info.purchaser);
    roomView.state = room.ctx.state;
    roomView.totalPrice = room.price.total;
    roomView.users = room.users.getUserList().map((user) => {
      return RoomUserView.from(user);
    });
    return roomView;
  }
}
