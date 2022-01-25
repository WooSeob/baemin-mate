import RoomContext, { RoomState } from "../context/context";
import { Room } from "../room";
import { User } from "../../../user/entity/user.entity";
import { HttpException, HttpStatus } from "@nestjs/common";

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
      throw new HttpException(`only for ${states}`, HttpStatus.BAD_REQUEST);
    }
  }

  onlyBeforeOrderFix() {
    if (this.ctx.state > RoomState.prepare) {
      throw new HttpException("onlyBeforeOrderFix", HttpStatus.BAD_REQUEST);
    }
  }

  onlyForPrepare() {
    if (this.ctx.state != RoomState.prepare) {
      throw new HttpException("onlyAtPrepare", HttpStatus.BAD_REQUEST);
    }
  }

  onlyForOrderFix() {
    if (this.ctx.state != RoomState.orderFix) {
      throw new HttpException("onlyAtOrderFix", HttpStatus.BAD_REQUEST);
    }
  }

  onlyForOrderCheck() {
    if (this.ctx.state != RoomState.orderCheck) {
      throw new HttpException("onlyAtOrderFix", HttpStatus.BAD_REQUEST);
    }
  }

  onlyForOrderDone() {
    if (this.ctx.state != RoomState.orderCheck) {
      throw new HttpException("onlyAtOrderFix", HttpStatus.BAD_REQUEST);
    }
  }

  onlyAfterOrderFix() {
    if (this.ctx.state < RoomState.orderFix) {
      throw new HttpException("onlyAfterOrderFix", HttpStatus.BAD_REQUEST);
    }
  }

  onlyPurchaser(user: User) {
    if (this.room.info.purchaser != user) {
      throw new HttpException(
        "this action is only for purchaser user",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  onlyForMember(user: User) {
    //TODO role이 purchaser or not purchaser 뿐만 아니라 더 늘어날때 대비해야함
    if (this.room.info.purchaser == user) {
      throw new HttpException(
          "this action is only for purchaser user",
          HttpStatus.BAD_REQUEST
      );
    }
  }

  onlyParticipant(user: User) {
    if (!this.room.users.has(user)) {
      throw new HttpException(
        `target(${user.id}) is not a member of room(${this.room.id})`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  onlyNotParticipant(user: User) {
    if (this.room.users.has(user)) {
      throw new HttpException(
        `target(${user.id}) is already member of room(${this.room.id})`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  onlyNotReady(user: User) {
    if (this.room.users.getIsReady(user)) {
      throw new HttpException(
        "this action is only for un ready state",
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
