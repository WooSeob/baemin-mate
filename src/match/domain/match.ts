import { SectionType, User } from "src/user/interfaces/user";
import { CreateMatchDto } from "../dto/create-match.dto";
import { MenuItem, TipBoundary } from "../interfaces/shop.interface";
import { CategoryType } from "../interfaces/category.interface";

export class Match {
  private static count: number = 0;
  readonly id: string;

  // required
  shopName: string;
  deliveryPriceAtLeast: number;
  deliveryTipsInterval: TipBoundary[];
  perchaser: User;

  sellectedMenus: Map<User, MenuItem[]>;
  deliveryTip: number;
  totalPrice: number;

  avgMannerRate: number;

  readonly category: CategoryType;
  readonly targetSection: SectionType;

  constructor(
    shopName: string,
    deliveryPriceAtLeast: number,
    deliveryTipsInterval: TipBoundary[],
    perchaser: User,
    category: CategoryType,
    section: SectionType
  ) {
    this.shopName = shopName;
    this.deliveryPriceAtLeast = deliveryPriceAtLeast;
    this.deliveryTipsInterval = deliveryTipsInterval;
    this.perchaser = perchaser;
    this.category = category;
    this.targetSection = section;

    this.totalPrice = 0;
    this.deliveryTip = deliveryTipsInterval[0].tip;

    this.id = (Match.count++).toString();
    this.avgMannerRate = perchaser.getMannerRate();
  }
}

export class MatchBuilder {
  private dto: CreateMatchDto;
  private purchaser: User;

  constructor(dto: CreateMatchDto) {
    this.dto = dto;
  }

  public setPerchaser(val: User): MatchBuilder {
    this.purchaser = val;
    return this;
  }

  public build(): Match {
    if (!this.purchaser) {
      throw new Error("all attributes required");
    }
    return new Match(
      this.dto.shopName,
      this.dto.deliveryPriceAtLeast,
      this.dto.deliveryTipsInterval,
      this.purchaser,
      this.dto.category,
      this.dto.section
    );
  }
}
