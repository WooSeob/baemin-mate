import { RoomEntity } from "../../room.entity";
import { RoomState } from "../../../const/RoomState";
import VoteOpinionEntity from "../../vote-opinion.entity";
import RoomVoteEntity, { RoomVoteType } from "../../room-vote.entity";
import { NotFoundException } from "@nestjs/common";

export default class ResetVoteFactory {
  static create(room: RoomEntity, requestUserId: string): RoomVoteEntity {
    if (!room) {
      throw new NotFoundException("존재하지 않는 방입니다.");
    }

    room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    const resetVote = new RoomVoteEntity();
    resetVote.room = room;
    resetVote.voteType = RoomVoteType.RESET;
    resetVote.opinions = room.participants
      .filter((p) => p.userId != requestUserId)
      .map((p) => new VoteOpinionEntity(resetVote, p));

    return resetVote;
  }
}
