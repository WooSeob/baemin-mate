import { SectionType } from "src/user/interfaces/user";
import { CategoryType } from "../../../match/interfaces/category.interface";
import { TipBoundary } from "../../../match/interfaces/shop.interface";

export class CreateRoomDto {
  shopName: string;
  deliveryPriceAtLeast: number;
  deliveryTipsInterval: TipBoundary[];
  category: CategoryType;
  section: SectionType;
}
