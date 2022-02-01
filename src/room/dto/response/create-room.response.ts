import { Room } from "src/domain/room/room";
import { ApiProperty } from "@nestjs/swagger";

export default class CreateRoomResponse {
  @ApiProperty({ description: "room id" })
  id: string;

  static from(room: Room): CreateRoomResponse {
    const res = new CreateRoomResponse();
    res.id = room.id;
    return res;
  }
}
