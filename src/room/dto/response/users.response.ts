import RoomUserView from "./user-view.dto";
import { User } from "../../../user/entity/user.entity";
import { SystemBody } from "./message.response";
import RoomUsers from "../../../domain/room/users/users";

export class UserJoinedResponse implements SystemBody {
  readonly action = "users-new";
  data: RoomUserView;
  static from(user: User) {
    const r = new UserJoinedResponse();
    r.data = RoomUserView.from(user);
    return r;
  }
}

export class UserLeaveResponse implements SystemBody {
  readonly action = "users-leave";
  data: RoomUserView;
  static from(user: User) {
    const r = new UserLeaveResponse();
    r.data = RoomUserView.from(user);
    return r;
  }
}

export class UserAllReadyResponse implements SystemBody {
  readonly action = "all-ready";
  data: {};
  static from(roomUsers: RoomUsers) {
    return new UserAllReadyResponse();
  }
}

export class UserAllReadyCanceledResponse implements SystemBody {
  readonly action = "all-ready-canceled";
  data: {};
  static from(roomUsers: RoomUsers) {
    return new UserAllReadyCanceledResponse();
  }
}