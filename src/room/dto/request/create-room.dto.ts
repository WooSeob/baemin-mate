import { SectionType } from "src/user/interfaces/user";
import { CategoryType } from "../../../match/interfaces/category.interface";

export class CreateRoomDto {
  shopName: string;
  deliveryPriceAtLeast: number;
  shopLink: string;
  category: CategoryType;
  section: SectionType;
}
