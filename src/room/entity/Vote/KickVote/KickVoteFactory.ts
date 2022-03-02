import { Room } from "../../Room";
import { RoomState } from "../../../const/RoomState";
import VoteOpinion from "../../VoteOpinion";
import RoomVote, { RoomVoteType } from "../../RoomVote";

export default class KickVoteFactory {
  static create(
    room: Room,
    requestUserId: string,
    targetUserId: string
  ): RoomVote {
    if (!room) {
      throw new Error("존재하지 않는 방입니다.");
    }

    room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    if (room.participants.length < 3) {
      throw new Error("2명 이상일 때 가능합니다.");
    }

    const idx = room.participants.findIndex((p) => p.userId === targetUserId);
    if (idx < 0) {
      throw new Error("해당 유저가 없습니다.");
    }

    const targetParticipant = room.participants[idx];

    const kickVote = new RoomVote();
    kickVote.room = room;
    kickVote.targetUser = targetParticipant.user;
    kickVote.voteType = RoomVoteType.KICK;
    // 투표 참여자 = 참여인원 - (투표 발의자, 투표 대상자)
    kickVote.opinions = room.participants
      .filter((p) => p.userId != targetUserId && p.userId != requestUserId)
      .map((p) => new VoteOpinion(kickVote, p));

    return kickVote;
  }
}
