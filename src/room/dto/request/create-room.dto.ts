import { CategoryType } from "../../../match/interfaces/category.interface";
import { IsEnum, IsInt, IsString, Length, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsValidShopLink } from "../../validators/IsValidShopLink";

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  @Length(1, 15)
  shopName: string;

  @ApiProperty()
  @IsInt()
  @Min(100)
  @Max(199999)
  deliveryPriceAtLeast: number;

  @ApiProperty()
  @IsValidShopLink()
  shopLink: string;

  @ApiProperty()
  @IsEnum(CategoryType)
  category: CategoryType;

  @ApiProperty()
  @IsInt()
  //TODO 실제 존재하는 section id 인지 확인하는 custom validator 구현해서 교체할것
  section: number;
}
