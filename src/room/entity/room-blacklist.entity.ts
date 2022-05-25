import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "./room.entity";
import { UserEntity } from "../../user/entity/user.entity";

export enum RoomBlackListReason {
  KICKED_BY_PURCHASER,
  KICKED_BY_VOTE,
}

@Entity()
export default class RoomBlacklistEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  reason: RoomBlackListReason;

  // 회원 탈퇴해도 블랙리스트 기록은 남아야함
  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => RoomEntity, (r) => r.blackList, {
    onDelete: "CASCADE",
  })
  room: RoomEntity;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  constructor(room: RoomEntity, userId: string, reason: RoomBlackListReason) {
    this.room = room;
    this.userId = userId;
    this.reason = reason;
  }
}
