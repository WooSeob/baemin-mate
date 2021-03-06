import RoomUserView from "./user-view.dto";
import { UserEntity } from "../../../user/entity/user.entity";
import { SystemBody } from "./message.response";

export class UserJoinedResponse implements SystemBody {
  readonly action = "users-new";
  data: RoomUserView;
  static from(user: UserEntity) {
    const r = new UserJoinedResponse();
    r.data = RoomUserView.from(user);
    return r;
  }
}

export class UserLeaveResponse implements SystemBody {
  readonly action = "users-leave";
  data: RoomUserView;
  static from(user: UserEntity) {
    const r = new UserLeaveResponse();
    r.data = RoomUserView.from(user);
    return r;
  }
}

export class UserLeaveByKickResponse implements SystemBody {
  readonly action = "users-leave-kick";
  data: RoomUserView;
  static from(user: UserEntity) {
    const r = new UserLeaveByKickResponse();
    r.data = RoomUserView.from(user);
    return r;
  }
}

// TODO from interface
export class UserLeaveByVoteResponse implements SystemBody {
  readonly action = "users-leave-vote";
  data: RoomUserView;
  static from(user: UserEntity) {
    const r = new UserLeaveByVoteResponse();
    r.data = RoomUserView.from(user);
    return r;
  }
}

export class UserAllReadyResponse implements SystemBody {
  readonly action = "all-ready";
  data: {};
  static from() {
    return new UserAllReadyResponse();
  }
}

export class UserAllReadyCanceledResponse implements SystemBody {
  readonly action = "all-ready-canceled";
  data: {};
  static from() {
    return new UserAllReadyCanceledResponse();
  }
}
