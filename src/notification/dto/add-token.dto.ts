import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AddTokenDto {
  @ApiProperty()
  @IsString()
  token: string;
}
