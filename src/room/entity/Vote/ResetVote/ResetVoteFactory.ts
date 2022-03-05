import { Room } from "../../Room";
import { RoomState } from "../../../const/RoomState";
import VoteOpinion from "../../VoteOpinion";
import RoomVote, { RoomVoteType } from "../../RoomVote";
import { NotFoundException } from "@nestjs/common";

export default class ResetVoteFactory {
  static create(room: Room, requestUserId: string): RoomVote {
    if (!room) {
      throw new NotFoundException("존재하지 않는 방입니다.");
    }

    room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    const resetVote = new RoomVote();
    resetVote.room = room;
    resetVote.voteType = RoomVoteType.RESET;
    resetVote.opinions = room.participants
      .filter((p) => p.userId != requestUserId)
      .map((p) => new VoteOpinion(resetVote, p));

    return resetVote;
  }
}
