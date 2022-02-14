import RoomUserView from "./user-view.dto";
import { ApiProperty } from "@nestjs/swagger";
import { Room } from "../../../entities/Room";

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
    roomView.shopName = room.shopName;
    roomView.purchaser = RoomUserView.from(room.purchaser);
    roomView.state = room.phase;
    roomView.totalPrice = room.getTotalPrice();
    roomView.users = room.participants.map((p) => {
      return RoomUserView.from(p.user);
    });
    return roomView;
  }
}
