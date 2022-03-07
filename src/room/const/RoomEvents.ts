import { RoomEntity } from "../entity/room.entity";
import { UserEntity } from "../../user/entity/user.entity";
import RoomVoteEntity from "../entity/room-vote.entity";

export default interface RoomEvents {
  create: (room: RoomEntity) => void;
  update: (room: RoomEntity) => void;
  delete: (room: RoomEntity) => void;

  userJoin: (roomId: string, userId: string) => void;
  userLeave: (roomId: string, userId: string) => void;
  userKicked: (roomId: string, userId: string) => void;

  allReady: (roomId: string) => void;
  allReadyCanceled: (roomId: string) => void;

  orderFix: (roomId: string) => void;
  orderCheck: (roomId: string) => void;
  orderDone: (roomId: string) => void;

  kickVoteCreated: (vote: RoomVoteEntity) => void;
  kickVoteFinished: (vote: RoomVoteEntity) => void;

  resetVoteCreated: (vote: RoomVoteEntity) => void;
  resetVoteFinished: (vote: RoomVoteEntity) => void;

  chat: (roomId: string, user: UserEntity, message: string) => void;
}
