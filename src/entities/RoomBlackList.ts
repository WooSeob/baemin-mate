import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";
import { User } from "../user/entity/user.entity";

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

  @Column()
  userId: string;

  @ManyToOne(() => Room, (r) => r.blackList, {
    onDelete: "CASCADE",
  })
  room: Room;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  user: User;

  constructor(room: Room, userId: string, reason: RoomBlackListReason) {
    this.room = room;
    this.userId = userId;
    this.reason = reason;
  }
}
