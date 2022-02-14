import { Room } from "../../Room";
import { RoomState } from "../../RoomState";
import VoteOpinion from "../../VoteOpinion";
import RoomVote, { RoomVoteType } from "../../RoomVote";

export default class ResetVoteFactory {
  static create(room: Room): RoomVote {
    if (!room) {
      throw new Error("존재하지 않는 방입니다.");
    }

    room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    const resetVote = new RoomVote();
    resetVote.room = room;
    resetVote.voteType = RoomVoteType.RESET;
    resetVote.opinions = Array.from(
      room.participants.map((p) => new VoteOpinion(resetVote, p))
    );
    return resetVote;
  }
}
