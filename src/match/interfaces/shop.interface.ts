import {ApiProperty} from "@nestjs/swagger";

export class MenuItem {
  @ApiProperty({ description: "메뉴 id" })
  id: string;

  @ApiProperty({ description: "메뉴 명" })
  name: string;

  @ApiProperty({ description: "수량" })
  quantity: number;

  @ApiProperty({ description: "상세설명" })
  description: string;

  @ApiProperty({ description: "단위 가격" })
  price: number;
}

export interface TipBoundary {
  price: number;
  tip: number;
}
