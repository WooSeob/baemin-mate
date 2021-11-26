import { SectionType } from "src/user/interfaces/user";
import { CategoryType } from "../interfaces/category.interface";
import { TipBoundary } from "../interfaces/shop.interface";

export class CreateMatchDto {
  userId: string;
  shopName: string;
  deliveryPriceAtLeast: number;
  deliveryTipsInterval: TipBoundary[];
  category: CategoryType;
  section: SectionType;
}
