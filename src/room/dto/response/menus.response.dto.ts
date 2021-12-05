import RoomUserView from "./user-view.dto";
import { MenuItem } from "../../../match/interfaces/shop.interface";
import { ApiProperty } from "@nestjs/swagger";

class UserMenus {
  @ApiProperty({ description: "유저 정보" })
  user: RoomUserView;

  @ApiProperty({ description: "메뉴 목록" })
  menus: MenuItem[];
}

export default class MenusResponseDto {
  @ApiProperty({ description: "유저별 메뉴목록의 리스트" })
  menusByUser: UserMenus[];
}
