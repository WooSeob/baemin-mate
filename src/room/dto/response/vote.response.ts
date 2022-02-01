import RoomUserView from "./user-view.dto";
import KickVote from "../../../domain/room/vote/KickVote";
import ResetVote from "../../../domain/room/vote/ResetVote";
import { SystemBody } from "./message.response";

export class KickVoteCreatedResponse implements SystemBody {
  readonly action = "vote-kick-created";
  data: {
    voteId: string;
    targetUser: RoomUserView;
  };
  static from(kickVote: KickVote) {
    const r = new KickVoteCreatedResponse();
    r.data = {
      voteId: kickVote.id,
      targetUser: RoomUserView.from(kickVote.target),
    };
    return r;
  }
}

export class KickVoteFinishedResponse implements SystemBody {
  readonly action = "vote-kick-finished";
  data: {
    voteId: string;
    target: RoomUserView;
    result: boolean;
  };
  static from(kickVote: KickVote) {
    const r = new KickVoteFinishedResponse();
    r.data = {
      voteId: kickVote.id,
      target: RoomUserView.from(kickVote.target),
      result: kickVote.result,
    };
    return r;
  }
}

export class ResetVoteCreatedResponse implements SystemBody {
  readonly action = "vote-reset-created";
  data: {
    voteId: string;
  };
  static from(resetVote: ResetVote) {
    const r = new ResetVoteCreatedResponse();
    r.data = {
      voteId: resetVote.id,
    };
    return r;
  }
}

export class ResetVoteFinishedResponse implements SystemBody {
  readonly action = "vote-reset-finished";
  data: {
    voteId: string;
    result: boolean;
  };
  static from(resetVote: ResetVote) {
    const r = new ResetVoteFinishedResponse();
    r.data = {
      voteId: resetVote.id,
      result: resetVote.result,
    };
    return r;
  }
}
