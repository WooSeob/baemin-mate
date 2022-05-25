import RoomUserView from "./user-view.dto";
import { MenuItem } from "../../../match/interfaces/shop.interface";
import { ApiProperty } from "@nestjs/swagger";

export class UserMenus {
  @ApiProperty({ description: "유저 정보" })
  user: RoomUserView;

  @ApiProperty({ description: "메뉴 목록", type: [MenuItem] })
  menus: MenuItem[];

  @ApiProperty({ description: "개인 배달 팁 금액" })
  deliveryTip: number;

  @ApiProperty({ description: "개인 총합 금액" })
  totalPrice: number;
}
