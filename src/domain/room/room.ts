import { SectionType } from "src/user/interfaces/user";
import { CategoryType } from "../../match/interfaces/category.interface";
import { EventEmitter } from "stream";
import RoomInfo from "./info/info";
import RoomMenus from "./menus/menus";
import RoomOrder from "./order/order";
import RoomUsers from "./users/users";
import RoomPrice from "./price/price";
import { Match } from "../match/match";
import RoomVote from "./vote/roomvote";
import RoomContext from "./context/context";
import RoomPolicy from "./policy/policy";
import { User } from "../../user/entity/user.entity";
import RoomChat from "./chat/chat";

/**
 * Policy
 *
 * 유저 : 참여는 하나의 Room만
 *
 * state 기준 : order fix ?
 *
 * role 기준 : 방장 or 참가자
 *
 * order fix 전
 *  - 레디, 레디풀기 가능,
 *  - 나가기 가능
 *  - 투표 불가능
 *  - 강퇴는 방장만 가능
 *  - 메뉴 resource C R U D 가능
 *
 * order fix 후
 *  - 레디 풀기 불가능
 *  - 나가기 불가능
 *  - 투표 가능
 *  - 방장의 강퇴권한 상실
 *  - 메뉴 resource R 만 가능
 *
 * */

export class Room extends EventEmitter {
  private static count: number = 0;
  readonly id: string;

  private _matches: Match[] = [];

  // required
  readonly info: RoomInfo;
  readonly menus: RoomMenus;
  readonly users: RoomUsers;
  readonly price: RoomPrice;
  readonly chat: RoomChat;

  readonly order: RoomOrder;
  readonly vote: RoomVote;

  readonly ctx: RoomContext;
  readonly policy: RoomPolicy;

  //join -> ready
  constructor(
    shopName: string,
    deliveryPriceAtLeast: number,
    purchaser: User,
    category: CategoryType,
    section: SectionType,
    shopLink: string
  ) {
    super();

    this.id = (Room.count++).toString();

    this.ctx = new RoomContext();
    this.menus = new RoomMenus(this);
    this.users = new RoomUsers(this);
    this.vote = new RoomVote(this);
    this.order = new RoomOrder(this);
    this.chat = new RoomChat(this);
    this.policy = new RoomPolicy(this);
    this.info = {
      shopName: shopName,
      purchaser: purchaser,
      category: category,
      section: section,
      createdAt: Date.now(),
      linkFor3rdApp: shopLink,
    };
    this.price = new RoomPrice(this, {
      total: 0,
      atLeast: deliveryPriceAtLeast,
    });

    this.users.add(purchaser);
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
