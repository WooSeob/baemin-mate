import { Room } from "../room";
import Vote from "./vote";
import { User } from "../../../user/entity/user.entity";

export default class KickVote extends Vote {
  private _target: User;

  get target(): User {
    return this._target;
  }

  constructor(room: Room, targetUser: User) {
    super();
    this.remain = new Set(
      room.users.getUserList().map((user) => {
        return user.id;
      })
    );
    this._target = targetUser;
    // 강퇴 지목자는 투표할 수 없음
    this.remain.delete(targetUser.id);
  }

  vote(user: User, opinion: boolean) {
    if (!this.remain.has(user.id)) {
      throw Error(`${user.id} has no authority for this vote, or already vote`);
    }

    this._result = this._result && opinion;
    this.remain.delete(user.id);

    if (this.remain.size == 0) {
      super.resultHook();
    }
  }
}
