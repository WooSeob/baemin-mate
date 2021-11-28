import { EventEmitter } from "stream";
import { Room } from "../room/room";
import RoomInfo from "../room/info/info";
import RoomUsers from "../room/users/users";
import RoomPrice from "../room/price/price";
import { v4 as uuidv4 } from "uuid";

export class Match extends EventEmitter {
  readonly id: string;
  private _room: Room;

  readonly info: RoomInfo;

  private _totalPrice: number;
  private _tip: number;
  private _users: number;

  constructor(room: Room) {
    super();
    this.id = uuidv4();
    this._room = room;
    this._room.addToMatches(this);

    this.info = room.info;
    this._totalPrice = room.price.total;
    this._tip = room.price.tip;
    this._users = room.users.getUserCount();

    room.price.on("update", (roomPrice: RoomPrice) => {
      this._totalPrice = roomPrice.total;
      this._tip = roomPrice.tip;
      this.emit("update", this);
    });

    room.users.on("add", (roomUsers: RoomUsers) => {
      this._users = roomUsers.getUserCount();
      this.emit("update", this);
    });

    room.users.on("delete", (roomUsers: RoomUsers) => {
      this._users = roomUsers.getUserCount();
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
}
