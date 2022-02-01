import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

export default class CreateVoteDto {
  @ApiProperty()
  @IsIn(["kick", "reset"])
  type: string;

  @ApiProperty()
  @IsString()
  target_uid: string;
}
