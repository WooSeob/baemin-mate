import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsObject, IsString, ValidateNested } from "class-validator";
import { OAuthInfo } from "../../../interface/OAuthInfo";
import { Type } from "class-transformer";

export default class CreateSignupSessionRequestV1 {
  @ApiProperty()
  @IsNumber()
  universityId: number;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => OAuthInfo)
  oauthInfo: OAuthInfo;
}
