import { EventEmitter } from "stream";
import { MenuItem } from "../../../match/interfaces/shop.interface";
import { Room } from "../room";
import { User } from "../../../user/entity/user.entity";

export default class RoomMenus extends EventEmitter {
  readonly room: Room;
  private selectedMenus: Map<User, Map<string, MenuItem>> = new Map();

  constructor(room: Room) {
    super();
    this.room = room;
  }

  add(user: User, menuItem: MenuItem) {
    if (!this.selectedMenus.has(user)) {
      this.selectedMenus.set(user, new Map());
    }
    this.selectedMenus.get(user).set(menuItem.id, menuItem);
    this.room.price.updatePrice(menuItem.price * menuItem.quantity);
    this.emit("add", user, this);
  }

  update(user: User, menuId: string, menu: MenuItem) {
    this._menuErrorHandle(user, menuId);
    const menus = this.selectedMenus.get(user);
    const priceDiff = (menu.price * menu.quantity) - (menus.get(menuId).price * menus.get(menuId).quantity);
    menus.set(menuId, menu);
    this.room.price.updatePrice(priceDiff);
    this.emit("update", user, this);
  }

  delete(user: User, menuId: string) {
    this._menuErrorHandle(user, menuId);

    const deletedMenu = this.selectedMenus.get(user).get(menuId);
    this.selectedMenus.get(user).delete(menuId);

    this.room.price.updatePrice(-(deletedMenu.price * deletedMenu.quantity));
    this.emit("delete", user, this);
  }

  clearForUser(user: User) {
    if (this.selectedMenus.has(user)) {
      let priceForUser = 0;
      for (let menu of this.selectedMenus.get(user).values()) {
        priceForUser += (menu.price * menu.quantity);
      }
      this.room.price.updatePrice(-priceForUser);
      this.selectedMenus.delete(user);
      this.emit("clean");
    }
  }

  private _menuErrorHandle(user: User, menuId: string) {
    // userid key error 처리
    if (!this.selectedMenus.has(user)) {
      throw new Error(`can't update menu. there is no key of ${user.id}`);
    }
    // menuid key error 처리
    if (!this.selectedMenus.get(user).has(menuId)) {
      throw new Error(`can't update menu. there is no key of ${menuId}`);
    }
  }

  getMenuMapByUser(user: User): Map<string, MenuItem> {
    if (!this.selectedMenus.has(user)) {
      return new Map();
    }
    return this.selectedMenus.get(user);
  }

  getMenusByUser(user: User): MenuItem[] {
    if (!this.selectedMenus.has(user)) {
      // throw new Error(`there is no key of ${user.getId()} at menus`);
      return [];
    }
    return Array.from(this.selectedMenus.get(user).values());
  }
}
