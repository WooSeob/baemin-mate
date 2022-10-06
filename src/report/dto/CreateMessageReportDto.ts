import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class CreateMessageReportDto {
  @ApiProperty()
  @IsString()
  reasonId: string;
}
