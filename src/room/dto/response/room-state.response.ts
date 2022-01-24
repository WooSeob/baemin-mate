import { ApiProperty } from "@nestjs/swagger";
import {RoomState} from "../../../domain/room/context/context";

export default class RoomStateResponse {
    @ApiProperty({ description: "방 진행 상태" })
    state: RoomState;

    @ApiProperty({ description: "유저의 role" })
    role: "purchaser" | "member";

    @ApiProperty({ description: "레디 여부" })
    isReady: boolean;
}
