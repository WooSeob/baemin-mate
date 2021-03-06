import { ApiProperty } from "@nestjs/swagger";
import { RoomState } from "../../const/RoomState";
import { RoomRole } from "../../entity/room.entity";

export default class RoomStateResponse {
  @ApiProperty({ description: "방 진행 상태" })
  state: RoomState;

  @ApiProperty({ description: "유저의 role" })
  role: RoomRole;

  @ApiProperty({ description: "레디 가능 여부", type: Boolean })
  isReadyAvailable: boolean;

  @ApiProperty({ description: "레디 여부" })
  isReady: boolean;
}
