import { User } from "src/user/interfaces/user";
import { CreateMatchDto } from "../dto/create-match.dto";
import { MenuItem, TipBoundary } from "../interfaces/shop.interface";

export class Match {
  // required
  shopName: string;
  deliveryPriceAtLeast: number;
  deliveryTipsInterval: TipBoundary[];
  perchaser: User;

  sellectedMenus: Map<User, MenuItem[]>;
  deliveryTip: number;
  totalPrice: number;

  avgMannerRate: number;

  constructor(
    shopName: string,
    deliveryPriceAtLeast: number,
    deliveryTipsInterval: TipBoundary[],
    perchaser: User
  ) {
    this.shopName = shopName;
    this.deliveryPriceAtLeast = deliveryPriceAtLeast;
    this.deliveryTipsInterval = deliveryTipsInterval;
    this.perchaser = perchaser;

    this.avgMannerRate = perchaser.getMannerRate();
  }
}

export class MatchBuilder {
  private shopName: string;
  private deliveryPriceAtLeast: number;
  private deliveryTipsInterval: TipBoundary[];
  private perchaser: User;

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

  public build(): Match {
    if (
      !(
        this.shopName &&
        this.deliveryPriceAtLeast &&
        this.deliveryPriceAtLeast &&
        this.perchaser
      )
    ) {
      throw new Error("all attributes required");
    }
    return new Match(
      this.shopName,
      this.deliveryPriceAtLeast,
      this.deliveryTipsInterval,
      this.perchaser
    );
  }
}
