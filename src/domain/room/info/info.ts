import { SectionType } from "../../../user/interfaces/user";
import { CategoryType } from "../../../match/interfaces/category.interface";
import { User } from "../../../user/entity/user.entity";

export default interface RoomInfo {
  readonly shopName: string;
  readonly purchaser: User;
  readonly category: CategoryType;
  readonly section: SectionType;
  readonly createdAt: number;
}
