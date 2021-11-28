import { User } from "../../../user/interfaces/user";
import { EventEmitter } from "stream";
import { Room } from "../room";

export default class RoomUsers extends EventEmitter {
  private users: Map<User, { user: User; ready: boolean }> = new Map();
  private mannerSum: number = 0;
  room: Room;

  constructor(room: Room) {
    super();
    this.room = room;
  }

  add(user: User) {
    this.users.set(user, {
      user: user,
      ready: false,
    });
    this.mannerSum += user.getMannerRate();
    this.emit("add", this);
  }

  delete(user: User) {
    this.users.delete(user);
    this.mannerSum -= user.getMannerRate();
    this.room.menus.clearForUser(user);
    this.emit("delete", this);
  }

  setReady(user: User, isReady: boolean) {
    this.users.get(user).ready = isReady;
  }

  getUserCount(): number {
    return this.users.size;
  }

  getAvgMannerRate(): number {
    return this.mannerSum / this.users.size;
  }

  getUserList(): User[] {
    return Array.from(this.users.keys());
  }
}
