import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, ValidateNested } from "class-validator";
import { OAuthInfo } from "../interface/OAuthInfo";

export default class SendCodeDto {
  @ApiProperty()
  @IsNumber()
  universityId: number;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @ValidateNested()
  oauthInfo: OAuthInfo;
}
