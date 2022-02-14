import { Room } from "../entities/Room";
import { User } from "../user/entity/user.entity";
import RoomVote from "../entities/RoomVote";

export default interface RoomEvents {
  create: (room: Room) => void;
  update: (room: Room) => void;
  delete: (room: Room) => void;

  userJoin: (roomId: string, userId: string) => void;
  userLeave: (roomId: string, userId: string) => void;
  userKicked: (roomId: string, userId: string) => void;

  allReady: (roomId: string) => void;
  allReadyCanceled: (roomId: string) => void;

  orderFix: (roomId: string) => void;
  orderCheck: (roomId: string) => void;
  orderDone: (roomId: string) => void;

  kickVoteCreated: (vote: RoomVote) => void;
  kickVoteFinished: (vote: RoomVote) => void;

  resetVoteCreated: (vote: RoomVote) => void;
  resetVoteFinished: (vote: RoomVote) => void;

  chat: (roomId: string, user: User, message: string) => void;
}
