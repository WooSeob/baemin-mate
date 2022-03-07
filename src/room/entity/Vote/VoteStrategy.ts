import RoomVoteEntity from "../room-vote.entity";

export default interface VoteStrategy {
  doVote(vote: RoomVoteEntity, userId: string, opinion: boolean);
}
