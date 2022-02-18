import { RoomState } from "../../../const/RoomState";
import { NotFoundException } from "@nestjs/common";
import RoomVote from "../../RoomVote";
import VoteStrategy from "../VoteStrategy";

export default class ResetVoteStrategy implements VoteStrategy {
  doVote(vote: RoomVote, userId: string, opinion: boolean) {
    vote.room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    const voter = vote.opinions.find((o) => o.participant.userId === userId);
    if (!voter) {
      throw new NotFoundException("투표 참가 대상이 아닙니다.");
    }

    if (voter.submitted) {
      throw new Error("이미 투표하셨습니다.");
    }
    voter.opinion = opinion;
    voter.submitted = true;
  }
}
