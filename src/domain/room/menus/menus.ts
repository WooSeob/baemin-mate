import { EventEmitter } from "stream";
import { User } from "../../../user/interfaces/user";
import { MenuItem } from "../../../match/interfaces/shop.interface";
import { Room } from "../room";

export default class RoomMenus extends EventEmitter {
  readonly room: Room;
  private selectedMenus: Map<User, MenuItem[]> = new Map();

  constructor(room: Room) {
    super();
    this.room = room;
  }

  add(user: User, menuItem: MenuItem) {
    if (!this.selectedMenus.has(user)) {
      this.selectedMenus.set(user, []);
    }
    this.selectedMenus.get(user).push(menuItem);
    this.room.price.updatePrice(menuItem.price);
    this.emit("add", user, this);
  }

  update(user: User, menuIdx: number, menu: MenuItem) {
    this._menuErrorHandle(user, menuIdx);
    const menus = this.selectedMenus.get(user);
    const priceDiff = menu.price - menus[menuIdx].price;
    this.room.price.updatePrice(priceDiff);
    this.emit("update", user, this);
  }

  delete(user: User, menuIdx: number) {
    this._menuErrorHandle(user, menuIdx);
    const menus = this.selectedMenus.get(user);
    const deletedMenu = menus[menuIdx];
    menus.splice(menuIdx, 1);
    this.room.price.updatePrice(-deletedMenu.price);
    this.emit("delete", user, this);
  }

  clearForUser(user: User) {
    if (this.selectedMenus.has(user)) {
      let priceForUser = 0;
      for (let menu of this.selectedMenus.get(user)) {
        priceForUser += menu.price;
      }
      this.room.price.updatePrice(-priceForUser);
      this.selectedMenus.delete(user);
      this.emit("clean");
    }
  }

  private _menuErrorHandle(user: User, menuIdx: number) {
    // key error 처리
    if (!this.selectedMenus.has(user)) {
      throw new Error(`can't update menu. there is no key of ${user.getId()}`);
    }
    // 인덱스 초과 처리
    if (menuIdx > this.selectedMenus.get(user).length) {
      throw new Error("menuIdx exceed array length");
    }
  }

  getMenusByUser(user: User): MenuItem[] {
    if (!this.selectedMenus.has(user)) {
      // throw new Error(`there is no key of ${user.getId()} at menus`);
      return [];
    }
    return this.selectedMenus.get(user);
  }
}
