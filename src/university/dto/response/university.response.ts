import { ApiProperty } from "@nestjs/swagger";
import RoomUserView from "../../../room/dto/response/user-view.dto";
import { MenuItem } from "../../../match/interfaces/shop.interface";

export class UniversityResponse {
  @ApiProperty({ description: "대학 id" })
  id: number;

  @ApiProperty({ description: "국문명" })
  korName: string;

  @ApiProperty({ description: "영문명" })
  engName: string;

  @ApiProperty({ description: "이메일 도메인" })
  emailDomain: string;
}
