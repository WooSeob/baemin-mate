import { Room } from "../../Room";
import { RoomState } from "../../../const/RoomState";
import VoteOpinion from "../../VoteOpinion";
import RoomVote, { RoomVoteType } from "../../RoomVote";

export default class KickVoteFactory {
  static create(room: Room, targetUserId: string): RoomVote {
    if (!room) {
      throw new Error("존재하지 않는 방입니다.");
    }

    room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    const idx = room.participants.findIndex((p) => p.userId === targetUserId);
    if (idx < 0) {
      throw Error("해당 유저가 없습니다.");
    }

    const targetParticipant = room.participants[idx];

    const kickVote = new RoomVote();
    kickVote.room = room;
    kickVote.targetUserId = targetUserId;
    kickVote.voteType = RoomVoteType.KICK;
    kickVote.opinions = Array.from(
      // TODO 투표 발의자도 포함시킬것인지?
      // 투표 참여자 = 강퇴 투표 대상자를 제외한 참여인원 전체
      room.participants
        .filter((p) => p.userId != targetUserId)
        .map((p) => new VoteOpinion(kickVote, p))
    );
    return kickVote;
  }
}
