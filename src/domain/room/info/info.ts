import { SectionType, User } from "../../../user/interfaces/user";
import { CategoryType } from "../../../match/interfaces/category.interface";

export default interface RoomInfo {
  readonly shopName: string;
  readonly purchaser: User;
  readonly category: CategoryType;
  readonly section: SectionType;
}
