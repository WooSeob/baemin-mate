import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export default class ChatRequestDto {
  @ApiProperty()
  @IsString()
  @IsUUID(4)
  roomId: string;

  @ApiProperty()
  @IsString()
  message: string;
}
