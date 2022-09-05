import { ApiProperty } from "@nestjs/swagger";
import { OAuthProvider } from "./OAuthProvider";
import { IsEnum, IsString } from "class-validator";

export class OAuthInfo {
  @ApiProperty({ enum: OAuthProvider })
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @ApiProperty()
  @IsString()
  payload: string;
}
