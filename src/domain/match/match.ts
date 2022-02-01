import { EventEmitter } from "stream";
import { Room } from "../room/room";
import RoomInfo from "../room/info/info";
import RoomUsers from "../room/users/users";
import RoomPrice from "../room/price/price";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../user/entity/user.entity";

export class Match extends EventEmitter {
  readonly id: string;
  private _room: Room;

  readonly info: RoomInfo;

  private _totalPrice: number;
  private _atLeast: number;
  private _tip: number;
  private _users: number;

  /**
   * Match 의 정보들은 Room 정보의 subset
   * Room 의 정보들 중 관심 목록은 향후 변경 가능성 높기 때문에
   * 관심 있는 정보들만 subscribe 한다.
   *
   * Events of Match Class : "update"
   * */
  constructor(room: Room) {
    super();
    this.id = uuidv4();
    this._room = room;
    this._room.addToMatches(this);

    this.info = room.info;
    this._totalPrice = room.price.total;
    this._tip = room.price.tip;
    this._users = room.users.getUserCount();
    this._atLeast = room.price.atLeast;

    room.price.on("update", (roomPrice: RoomPrice) => {
      this._totalPrice = roomPrice.total;
      this._tip = roomPrice.tip;
      this.emit("update", this);
    });

    room.users.on("add", (user: User) => {
      this._users = room.users.getUserCount();
      this.emit("update", this);
    });

    room.users.on("delete", (user: User) => {
      this._users = room.users.getUserCount();
      this.emit("update", this);
    });
  }

  get room(): Room {
    return this._room;
  }

  get tip(): number {
    return this._tip;
  }

  get users(): number {
    return this._users;
  }

  get totalPrice(): number {
    return this._totalPrice;
  }

  get atLeast(): number {
    return this._atLeast;
  }
}
