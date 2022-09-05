import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class NotificationDto {
  @ApiProperty()
  @IsBoolean()
  enabled?: boolean;
}
