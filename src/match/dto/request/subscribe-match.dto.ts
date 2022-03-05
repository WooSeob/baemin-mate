import { CategoryType } from "../../interfaces/category.interface";
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNumber } from "class-validator";

export class SubscribeMatchDto {
  @ApiProperty()
  @IsArray()
  @IsEnum(CategoryType, { each: true })
  category: CategoryType[];

  @ApiProperty()
  @IsArray()
  @IsNumber({}, { each: true })
  section: number[];
}
