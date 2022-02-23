import { SECTION, SectionType } from "src/user/interfaces/user";
import {
  CATEGORY,
  CategoryType,
} from "../../../match/interfaces/category.interface";
import { IsIn, IsNumber, IsString } from "class-validator";
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
  @IsIn([
    CATEGORY.KOREAN,
    CATEGORY.DDEOCK,
    CATEGORY.CHICKEN,
    CATEGORY.CHINESE,
    CATEGORY.PIZZA,
    CATEGORY.FASTFOOD,
    CATEGORY.JAPANESE,
    CATEGORY.PORKCUTLET,
    CATEGORY.WESTERN,
  ])
  category: CategoryType;

  @ApiProperty()
  @IsNumber()
  section: number;
}
