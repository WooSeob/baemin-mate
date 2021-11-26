import { SectionType, User } from "src/user/interfaces/user";
import { MenuItem, TipBoundary } from "../interfaces/shop.interface";
import { CategoryType } from "../interfaces/category.interface";
import { EventEmitter } from "stream";
import { CreateRoomDto } from "src/room/dto/request/create-room.dto";

export class Match extends EventEmitter {
  private static count: number = 0;
  readonly id: string;

  // required
  shopName: string;
  deliveryPriceAtLeast: number;
  deliveryTipsInterval: TipBoundary[];
  perchaser: User;

  deliveryTip: number;
  totalPrice: number;

  avgMannerRate: number;

  readonly category: CategoryType;
  readonly targetSection: SectionType;

  joiners: User[] = [];
  sellectedMenus: Map<User, MenuItem[]> = new Map();

  constructor(
    shopName: string,
    deliveryPriceAtLeast: number,
    deliveryTipsInterval: TipBoundary[],
    perchaser: User,
    category: CategoryType,
    section: SectionType
  ) {
    super();
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

    this.joiners.push(perchaser);

    setInterval(() => {
      this.addMenu(perchaser, { name: "싸이버거", price: 5000 });
    }, 3000);
  }

  join(user: User) {
    this.joiners.push(user);
    this.emit("new-user-join", user);
  }

  leave(user: User) {
    this.joiners.splice(
      this.joiners.findIndex((u) => u == user),
      1
    );
    this.emit("user-leave", user);
  }

  _updateTotal(price: number) {
    this.totalPrice = price;
    this.emit("update-matchInfo", this);
    this.emit("update-total", this);
  }

  addMenu(user: User, menuItem: MenuItem) {
    if (!this.sellectedMenus.has(user)) {
      this.sellectedMenus.set(user, []);
    }

    this.sellectedMenus.get(user).push(menuItem);
    const updatedPrice = this.totalPrice + menuItem.price;
    this._updateTotal(updatedPrice);
    this.emit("update-menu", user, this);
  }

  updateMenu(user: User, menuIdx: number, menu: MenuItem) {
    this._menuErrorHandle(user, menuIdx);
    const menus = this.sellectedMenus.get(user);
    const priceDiff = menu.price - menus[menuIdx].price;

    const updatedPrice = this.totalPrice + priceDiff;
    this._updateTotal(updatedPrice);
    this.emit("update-menu", user, this);
  }

  deleteMenu(user: User, menuIdx: number) {
    this._menuErrorHandle(user, menuIdx);
    const menus = this.sellectedMenus.get(user);
    const deletedMenu = menus[menuIdx];
    const updatedPrice = this.totalPrice - deletedMenu.price;

    menus.splice(menuIdx, 1);
    this._updateTotal(updatedPrice);
    this.emit("update-menu", user, this);
  }

  _menuErrorHandle(user: User, menuIdx: number) {
    // key error 처리
    if (!this.sellectedMenus.has(user)) {
      throw new Error(`can't update menu. there is no key of ${user.getId()}`);
    }
    // 인덱스 초과 처리
    if (menuIdx > this.sellectedMenus.get(user).length) {
      throw new Error("menuIdx exceed array length");
    }
  }
}

export class MatchBuilder {
  private dto: CreateRoomDto;
  private purchaser: User;

  constructor(dto: CreateRoomDto) {
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
