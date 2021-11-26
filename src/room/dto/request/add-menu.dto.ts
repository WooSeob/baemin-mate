import { MenuItem } from "src/match/interfaces/shop.interface";

export class AddMenuDto {
  userId: string;
  matchId: string;
  menu: MenuItem;
}
