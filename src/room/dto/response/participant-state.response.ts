import { ApiProperty } from "@nestjs/swagger";
import { RoomRole } from "../../entity/room.entity";
import { ParticipantEntity } from "../../entity/participant.entity";

export default class ParticipantStateResponse {
  @ApiProperty({ description: "방 id" })
  roomId: string;

  @ApiProperty({ description: "유저 id" })
  userId: string;

  @ApiProperty({ description: "유저 이름" })
  name: string;

  @ApiProperty({ description: "레디 여부" })
  isReady: boolean;

  @ApiProperty({ description: "유저의 role" })
  role: RoomRole;

  static from(participant: ParticipantEntity): ParticipantStateResponse {
    const response = new ParticipantStateResponse();
    response.roomId = participant.roomId;
    response.userId = participant.user.id;
    response.name = participant.user.name;
    response.isReady = participant.isReady;
    response.role = participant.role;
    return response;
  }
}
