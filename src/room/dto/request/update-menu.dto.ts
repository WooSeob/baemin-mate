import { MenuItem } from "src/match/interfaces/shop.interface";

export class UpdateMenuDto {
  userId: string;
  matchId: string;
  menuId: string;
  menu: MenuItem;
}
