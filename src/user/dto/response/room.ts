import { RoomState } from "src/domain/room/context/context";
import {ApiProperty} from "@nestjs/swagger";

export default class RoomDetailForUser {
  @ApiProperty({ description: "방 id" , type: String})
  id: string;

  @ApiProperty({ description: "방장 id" , type: String})
  purchaserId: string;

  @ApiProperty({ description: "가게명" , type: String})
  shopName: string;

  @ApiProperty({ description: "방 상태 정보(0: prepare, 1: orderFix, 2:orderCheck, 3:orderDone)" , type: Number})
  state: RoomState;

  @ApiProperty({ description: "방에서의 유저 role('purchaser' or 'member')" , type: String})
  role: "purchaser" | "member";

  @ApiProperty({ description: "방에서의 유저 레디 여부" , type: Boolean})
  isReady: boolean;
}
