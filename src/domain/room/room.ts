import { SectionType, User } from "src/user/interfaces/user";
import { TipBoundary } from "../../match/interfaces/shop.interface";
import { CategoryType } from "../../match/interfaces/category.interface";
import { EventEmitter } from "stream";
import { CreateRoomDto } from "src/room/dto/request/create-room.dto";
import RoomInfo from "./info/info";
import RoomMenus from "./menus/menus";
import RoomOrder from "./order/order";
import RoomUsers from "./users/users";
import RoomPrice from "./price/price";
import { Match } from "../match/match";

export class Room extends EventEmitter {
  private static count: number = 0;
  readonly id: string;

  private _matches: Match[];

  // required
  readonly info: RoomInfo;
  readonly menus: RoomMenus;
  readonly order: RoomOrder;
  readonly users: RoomUsers;
  readonly price: RoomPrice;

  constructor(
    shopName: string,
    deliveryPriceAtLeast: number,
    deliveryTipsInterval: TipBoundary[],
    purchaser: User,
    category: CategoryType,
    section: SectionType
  ) {
    super();

    this.id = (Room.count++).toString();

    this.menus = new RoomMenus(this);
    this.users = new RoomUsers(this);
    this.info = {
      shopName: shopName,
      purchaser: purchaser,
      category: category,
      section: section,
    };
    this.price = new RoomPrice(this, {
      total: 0,
      tip: deliveryTipsInterval[0].tip,
      deliveryTipsInterval: deliveryTipsInterval,
    });

    this.users.add(purchaser);

    setInterval(() => {
      this.menus.add(purchaser, { name: "싸이버거", price: 5000 });
    }, 3000);
  }

  addToMatches(match: Match) {
    this._matches.push(match);
  }

  deleteFromMatches(match: Match) {
    //TODO Link된 Match가 삭제될 때 해당 Room.matches 목록에서도 제거되어야 함
  }

  get matches(): Match[] {
    return this._matches;
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

  public build(): Room {
    if (!this.purchaser) {
      throw new Error("all attributes required");
    }
    return new Room(
      this.dto.shopName,
      this.dto.deliveryPriceAtLeast,
      this.dto.deliveryTipsInterval,
      this.purchaser,
      this.dto.category,
      this.dto.section
    );
  }
}
