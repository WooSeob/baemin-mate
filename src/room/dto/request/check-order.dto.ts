import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CheckOrderDto {
  @ApiProperty()
  @IsString()
  deliveryTip: number;

  @ApiProperty()
  @IsString()
  accountBank: string;

  @ApiProperty()
  @IsString()
  accountNum: string;

  @ApiProperty()
  @IsString()
  accountHolderName: string;
}
