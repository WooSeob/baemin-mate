import { RoomEntity } from "../../room.entity";
import { RoomState } from "../../../const/RoomState";
import VoteOpinionEntity from "../../vote-opinion.entity";
import RoomVoteEntity, { RoomVoteType } from "../../room-vote.entity";
import {
  KickVoteCreateOnlyPurchaserException,
  KickVoteNotAllowedUnderThreeException,
} from "../../../exceptions/room.exception";
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

    const targetParticipant = room.participants.find(
      (p) => p.userId === targetUserId
    );
    if (!targetParticipant) {
      throw new NotFoundException("참여자를 찾을 수 없습니다.");
    }

    const requestParticipant = room.participants.find(
      (p) => p.userId === requestUserId
    );
    if (!requestParticipant) {
      throw new NotFoundException("투표 생성자를 찾을 수 없습니다.");
    }

    // TODO 객체비교
    // 강퇴 투표 생성은 방장만 할 수 있다.
    if (room.purchaserId != requestParticipant.userId) {
      throw new KickVoteCreateOnlyPurchaserException();
    }

    const kickVote = new RoomVoteEntity();
    kickVote.room = room;
    kickVote.requestUser = requestParticipant.user;
    kickVote.targetUser = targetParticipant.user;
    kickVote.voteType = RoomVoteType.KICK;
    // 투표 참여자 = 참여인원 - (투표 발의자, 투표 대상자)
    kickVote.opinions = room.participants
      .filter((p) => p.userId != targetUserId && p.userId != requestUserId)
      .map((p) => new VoteOpinionEntity(kickVote, p));

    return kickVote;
  }
}
