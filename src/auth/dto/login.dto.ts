import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { OAuthProvider } from "../interface/OAuthProvider";

export class LoginDto {
  @ApiProperty({ enum: OAuthProvider })
  @IsEnum(OAuthProvider)
  type: OAuthProvider;

  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty({ required: false })
  @IsString()
  deviceToken?: string;
}
