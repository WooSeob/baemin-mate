import RoomContext, { RoomState } from "../context/context";
import { Room } from "../room";
import { User } from "../../../user/entity/user.entity";

export default class RoomPolicy {
  // static policy = {
  //   prepare: new Set([]),
  //   orderFix: new Set(["add", "update", "delete", "clearForUser"]),
  // }
  private room: Room;
  private ctx: RoomContext;

  constructor(room: Room) {
    this.room = room;
    this.ctx = room.ctx;
  }

  onlyFor(...states) {
    if (this.ctx.state in states) {
    } else {
      throw new Error(`only for ${states}`);
    }
  }

  onlyBeforeOrderFix() {
    if (this.ctx.state > RoomState.prepare) {
      throw new Error("onlyBeforeOrderFix");
    }
  }

  onlyForPrepare() {
    if (this.ctx.state != RoomState.orderFix) {
      throw new Error("onlyAtOrderFix");
    }
  }

  onlyForOrderFix() {
    if (this.ctx.state != RoomState.orderFix) {
      throw new Error("onlyAtOrderFix");
    }
  }

  onlyForOrderCheck() {
    if (this.ctx.state != RoomState.orderCheck) {
      throw new Error("onlyAtOrderFix");
    }
  }

  onlyForOrderDone() {
    if (this.ctx.state != RoomState.orderCheck) {
      throw new Error("onlyAtOrderFix");
    }
  }

  onlyAfterOrderFix() {
    if (this.ctx.state < RoomState.orderFix) {
      throw new Error("onlyAfterOrderFix");
    }
  }

  onlyPurchaser(user: User) {
    if (this.room.info.purchaser != user) {
      throw new Error("this action is only for purchaser user");
    }
  }

  onlyParticipant(user: User) {
    if (!this.room.users.has(user)) {
      throw new Error(
        `target(${user.id}) is not a member of room(${this.room.id})`
      );
    }
  }

  onlyNotReady(user: User) {
    if (this.room.users.getIsReady(user)) {
      throw new Error("this action is only for un ready state");
    }
  }
}
