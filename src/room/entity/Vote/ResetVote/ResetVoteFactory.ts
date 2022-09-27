import { RoomEntity } from "../../room.entity";
import { RoomState } from "../../../const/RoomState";
import VoteOpinionEntity from "../../vote-opinion.entity";
import RoomVoteEntity, { RoomVoteType } from "../../room-vote.entity";
import { NotFoundException } from "@nestjs/common";
import { UnfinishedVote } from "../../../exceptions/room.exception";
export default class ResetVoteFactory {
  static create(room: RoomEntity, requestUserId: string, unfinishedVotes: Array<RoomVoteEntity>): RoomVoteEntity {
    if (!room) {
      throw new NotFoundException("존재하지 않는 방입니다.");
    }

    room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    const requestParticipant = room.participants.find(
      (p) => p.userId === requestUserId
    );
    if (!requestParticipant) {
      throw new NotFoundException("투표 생성자를 찾을 수 없습니다.");
    }

    if (unfinishedVotes.length != 0) {
      throw new UnfinishedVote()
    }

    const resetVote = new RoomVoteEntity();
    resetVote.room = room;
    resetVote.requestUser = requestParticipant.user;
    resetVote.voteType = RoomVoteType.RESET;
    resetVote.opinions = room.participants
      .filter((p) => p.userId != requestUserId)
      .map((p) => new VoteOpinionEntity(resetVote, p));

    return resetVote;
  }
}
