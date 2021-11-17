import { User } from "src/user/interfaces/user";
import { CreateMatchDto } from "../dto/create-match.dto";
import { MenuItem, TipBoundary } from "../interfaces/shop.interface";
import { Valuable } from "../../core/interface/valuable";
import { EventEmitter } from "stream";

export class Match extends EventEmitter implements Valuable {
  // required
  shopName: string;
  deliveryPriceAtLeast: number;
  deliveryTipsInterval: TipBoundary[];
  perchaser: User;

  sellectedMenus: Map<User, MenuItem[]>;
  deliveryTip: number;
  totalPrice: number;

  avgMannerRate: number;

  createdAt: number;
  joiners: User[];

  constructor(
    shopName: string,
    deliveryPriceAtLeast: number,
    deliveryTipsInterval: TipBoundary[],
    perchaser: User,
    createdAt: number
  ) {
    super();
    this.shopName = shopName;
    this.deliveryPriceAtLeast = deliveryPriceAtLeast;
    this.deliveryTipsInterval = deliveryTipsInterval;
    this.perchaser = perchaser;

    this.avgMannerRate = perchaser.getMannerRate();

    this.createdAt = createdAt;
    this.joiners = [perchaser];
    console.log("-----------------------------------------");
    console.log(`match ${this.shopName}  has created (${this.perchaser.getId()})`);
  }

  public value(): number {
    let elapsedTime = Date.now() - this.createdAt;
    return (elapsedTime * 0.5 + this.avgMannerRate) / this.joiners.length;
  }

  public join(user: User) {
    this.joiners.push(user);
    this.avgMannerRate =
      (this.avgMannerRate * (this.joiners.length - 1) + user.getMannerRate()) /
      this.joiners.length;
  }
  public leave(user: User) {}
}

export class MatchBuilder {
  private shopName: string;
  private deliveryPriceAtLeast: number;
  private deliveryTipsInterval: TipBoundary[];
  private perchaser: User;
  private createdAt: number;

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

  public setCreateAt(val: number): MatchBuilder {
    this.createdAt = val;
    return this;
  }

  public build(): Match {
    if (
      !(
        this.shopName &&
        this.deliveryPriceAtLeast &&
        this.deliveryPriceAtLeast &&
        this.perchaser &&
        this.createdAt
      )
    ) {
      throw new Error("all attributes required");
    }
    return new Match(
      this.shopName,
      this.deliveryPriceAtLeast,
      this.deliveryTipsInterval,
      this.perchaser,
      this.createdAt
    );
  }
}
