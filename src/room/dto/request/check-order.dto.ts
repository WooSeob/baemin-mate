import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CheckOrderDto {
  @ApiProperty()
  @IsNumber()
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
