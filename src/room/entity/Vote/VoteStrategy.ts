import RoomVote from "../RoomVote";

export default interface VoteStrategy {
  doVote(vote: RoomVote, userId: string, opinion: boolean);
}
