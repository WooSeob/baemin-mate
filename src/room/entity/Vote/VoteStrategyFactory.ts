import { RoomVoteType } from "../room-vote.entity";
import ResetVoteStrategy from "./ResetVote/ResetVoteStrategy";
import VoteStrategy from "./VoteStrategy";
import KickVoteStrategy from "./KickVote/KickVoteStrategy";

export default class VoteStrategyFactory {
  static create(type: RoomVoteType): VoteStrategy {
    switch (type) {
      case RoomVoteType.KICK:
        return new KickVoteStrategy();
      case RoomVoteType.RESET:
        return new ResetVoteStrategy();
    }
  }
}
