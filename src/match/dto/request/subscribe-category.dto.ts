import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum } from "class-validator";
import { CategoryType } from "../../interfaces/category.interface";

export class SubscribeCategoryDto {
  @ApiProperty()
  @IsArray()
  @IsEnum(CategoryType, { each: true })
  categories: CategoryType[];
}
