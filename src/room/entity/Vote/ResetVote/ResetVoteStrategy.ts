import { RoomState } from "../../../const/RoomState";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import RoomVoteEntity from "../../room-vote.entity";
import VoteStrategy from "../VoteStrategy";
import {
  AlreadyDoVoteException,
  FinishedVoteException,
} from "../../../exceptions/room.exception";

export default class ResetVoteStrategy implements VoteStrategy {
  doVote(vote: RoomVoteEntity, userId: string, opinion: boolean) {
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

  //기준 만장일치
  private checkFinished(vote: RoomVoteEntity) {
    const numAgreeSubmitter = vote.opinions
      .filter((opinion) => opinion.submitted && opinion.opinion)
      .map((opinion) => 1)
      .reduce((prev, current) => prev + current, 0);

    const numDisAgreeSubmitter = vote.opinions
      .filter((opinion) => opinion.submitted && !opinion.opinion)
      .map((opinion) => 1)
      .reduce((prev, current) => prev + current, 0);

    if (numDisAgreeSubmitter > 0) {
      vote.finished = true;
      vote.result = false;
    } else if (numAgreeSubmitter == vote.opinions.length) {
      vote.finished = true;
      vote.result = true;
    }
  }
}
