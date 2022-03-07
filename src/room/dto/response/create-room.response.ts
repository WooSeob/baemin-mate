import { ApiProperty } from "@nestjs/swagger";
import { RoomEntity } from "../../entity/room.entity";

export default class CreateRoomResponse {
  @ApiProperty({ description: "room id" })
  id: string;

  static from(room: RoomEntity): CreateRoomResponse {
    const res = new CreateRoomResponse();
    res.id = room.id;
    return res;
  }
}
