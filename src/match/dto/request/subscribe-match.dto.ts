import { CategoryType } from "../../interfaces/category.interface";
import { SectionType } from "../../../user/interfaces/user";

export class SubscribeMatchDto {
  category: CategoryType[];
  section: SectionType[];
}
