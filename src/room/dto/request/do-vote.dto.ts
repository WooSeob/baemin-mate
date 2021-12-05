import { IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export default class DoVoteDto {
  @ApiProperty()
  @IsBoolean()
  agree: boolean;
}
