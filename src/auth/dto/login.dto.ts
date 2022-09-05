import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsObject, IsString, ValidateNested } from "class-validator";
import { OAuthInfo } from "../interface/OAuthInfo";
import { Type } from "class-transformer";

export class LoginDto {
  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => OAuthInfo)
  oauthInfo: OAuthInfo;

  @ApiProperty({ required: false })
  @IsString()
  deviceToken?: string;
}
