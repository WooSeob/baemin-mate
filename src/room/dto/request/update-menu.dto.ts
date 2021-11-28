import { MenuItem } from "src/match/interfaces/shop.interface";

export class UpdateMenuDto {
  userId: string;
  roomId: string;
  menuId: string;
  menu: MenuItem;
}
