import { ApiProperty } from "@nestjs/swagger";
import { Room } from "../../entity/Room";

export default class CreateRoomResponse {
  @ApiProperty({ description: "room id" })
  id: string;

  static from(room: Room): CreateRoomResponse {
    const res = new CreateRoomResponse();
    res.id = room.id;
    return res;
  }
}
