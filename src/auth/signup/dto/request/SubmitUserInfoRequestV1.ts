import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class SubmitUserInfoRequestV1 {
  @ApiProperty()
  @IsString()
  nickname: string;
}
