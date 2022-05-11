import { RoomState } from "src/room/const/RoomState";
import { ApiProperty } from "@nestjs/swagger";
import { RoomRole } from "../../../room/entity/room.entity";

export default class RoomDetailForUser {
  @ApiProperty({ description: "방 id", type: String })
  id: string;

  @ApiProperty({ description: "방장 id", type: String })
  purchaserId: string;

  @ApiProperty({ description: "가게명", type: String })
  shopName: string;

  @ApiProperty({ description: "가게 외부 배달앱 공유 링크", type: String })
  shopLink: string;

  @ApiProperty({
    description:
      "방 상태 정보(0: prepare, 1: allReady, 2: orderFix, 3: orderCheck, 4: orderDone, 5: orderCanceled)",
    type: Number,
  })
  state: RoomState;

  @ApiProperty({
    description: "방에서의 유저 role('purchaser' or 'member')",
    type: String,
  })
  role: RoomRole;

  @ApiProperty({ description: "레디 가능 여부", type: Boolean })
  isReadyAvailable: boolean;

  @ApiProperty({ description: "방에서의 유저 레디 여부", type: Boolean })
  isReady: boolean;
}
