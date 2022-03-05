import { CategoryType } from "../../../match/interfaces/category.interface";
import { IsEnum, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  shopName: string;

  @ApiProperty()
  @IsNumber()
  deliveryPriceAtLeast: number;

  @ApiProperty()
  @IsString()
  shopLink: string;

  @ApiProperty()
  @IsEnum(CategoryType)
  category: CategoryType;

  @ApiProperty()
  @IsNumber()
  section: number;
}
