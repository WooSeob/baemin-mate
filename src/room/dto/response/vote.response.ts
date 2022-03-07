import RoomUserView from "./user-view.dto";
import { SystemBody } from "./message.response";
import RoomVoteEntity, { RoomVoteType } from "../../entity/room-vote.entity";
import { ApiProperty } from "@nestjs/swagger";

export class VoteResponse {
  @ApiProperty({ description: "room id" })
  id: string;

  @ApiProperty({ description: "room id" })
  type: RoomVoteType;

  @ApiProperty({ description: "room id" })
  finished: boolean;

  @ApiProperty({ description: "room id" })
  result: boolean;

  @ApiProperty({ description: "room id" })
  metadataId: string;

  static from(vote: RoomVoteEntity): VoteResponse {
    const instance = new VoteResponse();
    instance.id = vote.id;
    instance.type = vote.voteType;
    instance.finished = vote.finished;
    instance.result = vote.result;
    instance.metadataId = vote.targetUserId;
    return instance;
  }
}

export class KickVoteCreatedResponse implements SystemBody {
  readonly action = "vote-kick-created";
  data: {
    voteId: string;
    targetUser: RoomUserView;
  };
  static from(kickVote: RoomVoteEntity) {
    const r = new KickVoteCreatedResponse();
    r.data = {
      voteId: kickVote.id,
      targetUser: RoomUserView.from(kickVote.targetUser),
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
  static from(kickVote: RoomVoteEntity) {
    const r = new KickVoteFinishedResponse();
    r.data = {
      voteId: kickVote.id,
      target: RoomUserView.from(kickVote.targetUser),
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
  static from(resetVote: RoomVoteEntity) {
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
  static from(resetVote: RoomVoteEntity) {
    const r = new ResetVoteFinishedResponse();
    r.data = {
      voteId: resetVote.id,
      result: resetVote.result,
    };
    return r;
  }
}
