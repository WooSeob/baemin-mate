import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";
import { User } from "../../user/entity/user.entity";

export enum RoomBlackListReason {
  KICKED_BY_PURCHASER,
  KICKED_BY_VOTE,
}

@Entity()
export default class RoomBlackList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  reason: RoomBlackListReason;

  // 회원 탈퇴해도 블랙리스트 기록은 남아야함
  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Room, (r) => r.blackList, {
    onDelete: "CASCADE",
  })
  room: Room;

  @ManyToOne(() => User)
  user: User;

  constructor(room: Room, userId: string, reason: RoomBlackListReason) {
    this.room = room;
    this.userId = userId;
    this.reason = reason;
  }
}
