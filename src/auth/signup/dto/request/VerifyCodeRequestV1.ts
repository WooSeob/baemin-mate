import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class VerifyCodeRequestV1 {
  @ApiProperty()
  @IsString()
  code: string;
}
