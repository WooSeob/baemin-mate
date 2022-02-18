import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LogoutDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}
