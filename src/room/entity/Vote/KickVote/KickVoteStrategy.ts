import { RoomState } from "../../../const/RoomState";
import { NotFoundException } from "@nestjs/common";
import RoomVote from "../../RoomVote";
import VoteStrategy from "../VoteStrategy";

export default class KickVoteStrategy implements VoteStrategy {
  doVote(vote: RoomVote, userId: string, opinion: boolean) {
    // 방장이 투표가능?
    // 대상자가 투표가능?
    // 투표 생성자가 투표가능?
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
    this.checkFinished(vote);
  }

  private checkFinished(vote: RoomVote) {
    const numAgreeSubmitter = vote.opinions
      .filter((opinion) => opinion.submitted && opinion.opinion)
      .map((opinion) => 1)
      .reduce((prev, current) => prev + current, 0);

    const numDisAgreeSubmitter = vote.opinions
      .filter((opinion) => opinion.submitted && !opinion.opinion)
      .map((opinion) => 1)
      .reduce((prev, current) => prev + current, 0);

    if (numAgreeSubmitter + numDisAgreeSubmitter == vote.opinions.length) {
      // 모두제출 -> 투표 종료
      vote.finished = true;
      // 결과 = 과반 이상 찬성인지?
      vote.result = numAgreeSubmitter > vote.opinions.length / 2;
      //TODO 결과 통지 어디서?
    }
  }
}
