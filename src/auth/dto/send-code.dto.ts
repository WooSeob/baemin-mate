import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SendCodeDto {
  @ApiProperty()
  @IsString()
  email: string;
}
