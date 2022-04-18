import RoomUserView from "./user-view.dto";
import { SystemBody } from "./message.response";
import RoomVoteEntity, { RoomVoteType } from "../../entity/room-vote.entity";
import { ApiProperty } from "@nestjs/swagger";

export class VoteResponse {
  @ApiProperty({ description: "room id" })
  id: string;

  @ApiProperty({
    description: "투표 타입 / 강퇴 : 0, 초기화 : 1",
  })
  type: RoomVoteType;

  @ApiProperty({ description: "투표 종료 여부" })
  finished: boolean;

  @ApiProperty({ description: "투표 결과" })
  result: boolean;

  @ApiProperty({
    description: "메타 데이터 id (강퇴 투표의 경우 강퇴 대상 유저 id)",
  })
  metadataId: string;

  @ApiProperty({
    description: "의견 제출 대상자 여부",
  })
  canVote: boolean = false;

  @ApiProperty({
    description: "의견 제출 여부",
  })
  submitted: boolean = false;

  static from(vote: RoomVoteEntity, participantId: string): VoteResponse {
    const instance = new VoteResponse();
    instance.id = vote.id;
    instance.type = vote.voteType;
    instance.finished = vote.finished;
    instance.result = vote.result;
    instance.metadataId = vote.targetUserId;

    const opinion = vote.getOpinion(participantId);
    if (opinion) {
      instance.canVote = true;
      instance.submitted = opinion.submitted;
    }
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
