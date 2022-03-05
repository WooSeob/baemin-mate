import { RoomState } from "../../../const/RoomState";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import RoomVote from "../../RoomVote";
import VoteStrategy from "../VoteStrategy";
import {
  AlreadyDoVoteException,
  FinishedVoteException,
} from "../../../exceptions/room.exception";

export default class ResetVoteStrategy implements VoteStrategy {
  doVote(vote: RoomVote, userId: string, opinion: boolean) {
    vote.room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    const voter = vote.opinions.find((o) => o.participant.userId === userId);
    if (!voter) {
      throw new UnauthorizedException("투표 참가 대상이 아닙니다.");
    }

    if (vote.finished) {
      throw new FinishedVoteException();
    }

    if (voter.submitted) {
      throw new AlreadyDoVoteException();
    }

    voter.opinion = opinion;
    voter.submitted = true;
    this.checkFinished(vote);
  }

  //기준 과반이상
  private checkFinished(vote: RoomVote) {
    const numAgreeSubmitter = vote.opinions
      .filter((opinion) => opinion.submitted && opinion.opinion)
      .map((opinion) => 1)
      .reduce((prev, current) => prev + current, 0);

    const numDisAgreeSubmitter = vote.opinions
      .filter((opinion) => opinion.submitted && !opinion.opinion)
      .map((opinion) => 1)
      .reduce((prev, current) => prev + current, 0);

    if (numAgreeSubmitter + numDisAgreeSubmitter >= vote.opinions.length / 2) {
      vote.finished = true;
      vote.result = numAgreeSubmitter >= vote.opinions.length / 2;
    }
  }
}
