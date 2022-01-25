import { EventEmitter } from "stream";
import { Room } from "../room";
import { User } from "../../../user/entity/user.entity";

export default class RoomUsers extends EventEmitter {
  private _users: Map<User, { user: User; ready: boolean }> = new Map();
  private mannerSum: number = 0;
  private _room: Room;

  private _nowAllReady: boolean = false;

  constructor(room: Room) {
    super();
    this._room = room;
  }

  add(user: User) {
    user.join(this._room);
    this._users.set(user, {
      user: user,
      ready: false,
    });
    this.mannerSum += user.mannerRate;
    this.emit("add", user);
  }

  delete(user: User) {
    user.leaveRoom(this._room.id);
    this._users.delete(user);
    this.mannerSum -= user.mannerRate;
    this._room.menus.clearForUser(user);
    this.emit("delete", user);
  }

  getIsReady(user: User) {
    return this._users.get(user).ready;
  }

  setReady(user: User, isReady: boolean) {
    //TODO 트랙잭션 처리 해야할거같은 느낌
    this._users.get(user).ready = isReady

    const allReady = Array.from(this._users.values())
        .filter((user) => {
          return this._room.info.purchaser != user.user;
        })
        .map(user => {
          return user.ready
        })
        .reduce((prev, current) => {
          return prev && current
        }, true)

    if (allReady){
      this.emit("all-ready", this);
    } else {
      if (this._nowAllReady){
        this.emit("all-ready-canceled", this)
      }
    }

    this._nowAllReady = allReady;
  }

  getUserCount(): number {
    return this._users.size;
  }

  getAvgMannerRate(): number {
    return this.mannerSum / this._users.size;
  }

  getUserList(): User[] {
    return Array.from(this._users.keys());
  }

  has(user: User): boolean {
    return this._users.has(user);
  }
}
