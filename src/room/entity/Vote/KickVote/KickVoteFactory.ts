import { RoomEntity } from "../../room.entity";
import { RoomState } from "../../../const/RoomState";
import VoteOpinionEntity from "../../vote-opinion.entity";
import RoomVoteEntity, { RoomVoteType } from "../../room-vote.entity";
import { KickVoteNotAllowedUnderThreeException } from "../../../exceptions/room.exception";
import { NotFoundException } from "@nestjs/common";

export default class KickVoteFactory {
  static create(
    room: RoomEntity,
    requestUserId: string,
    targetUserId: string
  ): RoomVoteEntity {
    if (!room) {
      throw new NotFoundException("존재하지 않는 방입니다.");
    }

    room.onlyAt(RoomState.ORDER_FIX, RoomState.ORDER_CHECK);

    if (room.participants.length < 3) {
      throw new KickVoteNotAllowedUnderThreeException();
    }

    const idx = room.participants.findIndex((p) => p.userId === targetUserId);
    if (idx < 0) {
      throw new NotFoundException("참여자를 찾을 수 없습니다.");
    }

    const targetParticipant = room.participants[idx];

    const kickVote = new RoomVoteEntity();
    kickVote.room = room;
    kickVote.targetUser = targetParticipant.user;
    kickVote.voteType = RoomVoteType.KICK;
    // 투표 참여자 = 참여인원 - (투표 발의자, 투표 대상자)
    kickVote.opinions = room.participants
      .filter((p) => p.userId != targetUserId && p.userId != requestUserId)
      .map((p) => new VoteOpinionEntity(kickVote, p));

    return kickVote;
  }
}
