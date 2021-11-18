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
  private shopName: string;
  private deliveryPriceAtLeast: number;
  private deliveryTipsInterval: TipBoundary[];
  private perchaser: User;
  private category: CategoryType;
  private targetSection: SectionType;

  public setShopName(val: string): MatchBuilder {
    this.shopName = val;
    return this;
  }

  public setDeliveryPriceAtLeast(val: number): MatchBuilder {
    this.deliveryPriceAtLeast = val;
    return this;
  }

  public setDeliveryTipsInterval(val: TipBoundary[]): MatchBuilder {
    this.deliveryTipsInterval = val;
    return this;
  }

  public setPerchaser(val: User): MatchBuilder {
    this.perchaser = val;
    return this;
  }

  public setCategory(val: CategoryType): MatchBuilder {
    this.category = val;
    return this;
  }

  public setSection(val: SectionType): MatchBuilder {
    this.targetSection = val;
    return this;
  }

  public build(): Match {
    if (
      !(
        this.shopName &&
        this.deliveryPriceAtLeast &&
        this.deliveryPriceAtLeast &&
        this.perchaser &&
        this.category &&
        this.targetSection
      )
    ) {
      throw new Error("all attributes required");
    }
    return new Match(
      this.shopName,
      this.deliveryPriceAtLeast,
      this.deliveryTipsInterval,
      this.perchaser,
      this.category,
      this.targetSection
    );
  }
}
