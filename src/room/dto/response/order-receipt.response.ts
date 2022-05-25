import { ApiProperty } from "@nestjs/swagger";
import { MenuItem } from "src/match/interfaces/shop.interface";

export default class OrderReceiptResponse {
  @ApiProperty({ description: "사용자 주문 메뉴들", type: [MenuItem] })
  menus: MenuItem[];

  @ApiProperty({ description: "사용자 배달팁 정산금액" })
  tipForUser: number;

  @ApiProperty({ description: "해당 배달건의 배달팁" })
  totalDeliveryTip: number;

  @ApiProperty({ description: "최종 합계 금액" })
  totalPrice: number;

  @ApiProperty({ description: "계좌 번호" })
  accountNumber: string;

  @ApiProperty({ description: "계좌 은행" })
  accountBank: string;

  @ApiProperty({ description: "입금주 명" })
  accountUserName: string;
}
