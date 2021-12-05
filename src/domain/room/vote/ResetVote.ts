import { Room } from "../room";
import Vote from "./vote";
import { User } from "../../../user/entity/user.entity";

export default class ResetVote extends Vote {
  constructor(room: Room) {
    super();
    this.remain = new Set(
      room.users.getUserList().map((user) => {
        return user.id;
      })
    );
  }

  vote(user: User, opinion: boolean) {
    if (!this.remain.has(user.id)) {
      throw Error(`${user.id} has no authority for this vote, or already vote`);
    }

    this._result = this._result && opinion;
    this.remain.delete(user.id);

    if (this.remain.size == 0) {
      super.result();
    }
  }
}
