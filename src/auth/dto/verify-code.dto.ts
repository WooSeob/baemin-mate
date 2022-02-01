import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class VerifyCodeDto {
  @ApiProperty()
  @IsString()
  authCode: string;
}
